#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
セキュリティ監視 (security-watch)
  1. CVEProject/cvelistV5 の deltaLog.json から前回実行以降に追加・更新された CVE を取り、
     各レコード (CVE JSON 5.x) の affected / 説明文を security/inventory.json の監視対象と照合する。
  2. OSV.dev で npm パッケージ (supabase-js など) の脆弱性を取得する。
  3. 新しい該当があれば GitHub Issue を起票し、SMTP でメール通知する。
  4. 結果を security/log/YYYY-MM.md に追記し、security/state.json に既知の CVE を記録する。

依存: Python 3.10+ 標準ライブラリのみ。
環境変数:
  GITHUB_TOKEN, GITHUB_REPOSITORY  Issue 起票用 (GitHub Actions が自動で渡す)
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO  メール通知 (未設定ならメールは送らない)
  LOOKBACK_DAYS  state が無い初回に遡る日数 (既定 7)
オプション:
  --dry-run   Issue 起票・メール送信・state/log 更新をしない (結果だけ表示)
  --days N    LOOKBACK_DAYS の上書き
"""
import argparse
import json
import os
import re
import smtplib
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from email.header import Header
from email.mime.text import MIMEText
from email.utils import formataddr

HERE = os.path.dirname(os.path.abspath(__file__))
INVENTORY = os.path.join(HERE, "inventory.json")
STATE = os.path.join(HERE, "state.json")
LOG_DIR = os.path.join(HERE, "log")
DELTA_LOG_URL = "https://raw.githubusercontent.com/CVEProject/cvelistV5/main/cves/deltaLog.json"
OSV_QUERY_URL = "https://api.osv.dev/v1/query"
UA = "vietnam-pj-security-watch/1.0 (+github.com/yuya-kuroki-pif/Vietnam.pj.Ver4)"
MAX_RECORDS = 6000   # 1 回の実行で読む CVE レコード数の上限 (初回の遡り過ぎ防止)
JST = timezone(timedelta(hours=9))


def http_json(url, data=None, headers=None, timeout=60, retries=3):
    body = json.dumps(data).encode("utf-8") if data is not None else None
    hdr = {"User-Agent": UA, "Accept": "application/json"}
    if data is not None:
        hdr["Content-Type"] = "application/json"
    hdr.update(headers or {})
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, data=body, headers=hdr)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            last = e
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(2 * (i + 1))
                continue
            raise
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last = e
            time.sleep(2 * (i + 1))
    raise RuntimeError(f"fetch failed: {url}: {last}")


# ---------------------------------------------------------------- CVE レコードの読み取り
def cve_fields(rec):
    """CVE JSON 5.x から照合に使う項目を取り出す。"""
    meta = rec.get("cveMetadata", {})
    cont = rec.get("containers", {})
    cna = cont.get("cna", {}) or {}
    adps = cont.get("adp", []) or []

    vendors, products, cpes = set(), set(), set()
    for src in [cna] + adps:
        for a in src.get("affected", []) or []:
            if a.get("vendor"):
                vendors.add(str(a["vendor"]))
            for k in ("product", "packageName", "collectionURL", "repo"):
                if a.get(k):
                    products.add(str(a[k]))
            for c in a.get("cpes", []) or []:
                cpes.add(str(c))
        for app in src.get("cpeApplicability", []) or []:
            for node in app.get("nodes", []) or []:
                for m in node.get("cpeMatch", []) or []:
                    if m.get("criteria"):
                        cpes.add(str(m["criteria"]))

    title = str(cna.get("title") or "")
    desc = ""
    for d in cna.get("descriptions", []) or []:
        if str(d.get("lang", "")).lower().startswith("en"):
            desc = str(d.get("value") or "")
            break
    if not desc and cna.get("descriptions"):
        desc = str(cna["descriptions"][0].get("value") or "")

    # CVSS: CNA 優先、無ければ ADP (CISA-ADP など)
    score, vector, sev = None, "", ""
    for src in [cna] + adps:
        for m in src.get("metrics", []) or []:
            for key in ("cvssV4_0", "cvssV3_1", "cvssV3_0"):
                v = m.get(key)
                if v and v.get("baseScore") is not None:
                    s = float(v["baseScore"])
                    if score is None or s > score:
                        score, vector, sev = s, str(v.get("vectorString", "")), str(v.get("baseSeverity", ""))
    kev = False
    for adp in adps:
        for m in adp.get("metrics", []) or []:
            o = m.get("other") or {}
            if str(o.get("type", "")).lower() == "kev":
                kev = True
    state = str(meta.get("state", ""))
    return {
        "id": str(meta.get("cveId", "")),
        "state": state,
        "published": str(meta.get("datePublished", ""))[:10],
        "updated": str(meta.get("dateUpdated", ""))[:19],
        "vendors": sorted(vendors), "products": sorted(products), "cpes": sorted(cpes),
        "title": title, "desc": desc, "score": score, "vector": vector, "severity": sev, "kev": kev,
        "assigner": str(meta.get("assignerShortName", "")),
    }


def match_item(f, item):
    """監視対象 1 件との照合。('strong'|'weak'|None, 根拠) を返す。"""
    def any_match(pats, values):
        for p in pats:
            rx = re.compile(p, re.I)
            for v in values:
                if rx.search(v):
                    return v
        return None
    vend = any_match(item.get("vendor", []), f["vendors"])
    prod = any_match(item.get("product", []), f["products"])
    cpe_vals = f["cpes"]
    cpe_hit = None
    if cpe_vals:
        # cpe:2.3:a:vendor:product:... の vendor/product 部分で照合
        for c in cpe_vals:
            parts = c.split(":")
            if len(parts) >= 5:
                cv, cp = parts[3], parts[4]
                if any_match(item.get("vendor", []), [cv]) and any_match(item.get("product", []), [cp]):
                    cpe_hit = c
                    break
    if cpe_hit:
        return "strong", f"cpe={cpe_hit}"
    if vend and prod:
        return "strong", f"vendor={vend} product={prod}"
    if prod and not f["vendors"]:
        return "strong", f"product={prod}"
    # ベンダーだけの一致は採用しない (Google / GitHub など大手ベンダーの無関係な製品でノイズになる)。
    # ベンダー名が特有のもの (supabase) は text キーワードで拾う。
    txt = any_match(item.get("text", []), [f["title"] + "\n" + f["desc"]])
    if txt:
        return "weak", "text keyword"
    return None, ""


# ---------------------------------------------------------------- OSV
def osv_vulns(ecosystem, name):
    data = http_json(OSV_QUERY_URL, data={"package": {"name": name, "ecosystem": ecosystem}})
    out = []
    for v in (data or {}).get("vulns", []) or []:
        fixed = []
        for a in v.get("affected", []) or []:
            pkg = a.get("package", {}) or {}
            if pkg.get("name") != name:
                continue
            for r in a.get("ranges", []) or []:
                for ev in r.get("events", []) or []:
                    if ev.get("fixed"):
                        fixed.append(ev["fixed"])
        score = None
        for s in v.get("severity", []) or []:
            # CVSS ベクトルのみのことが多い。database_specific.severity があれば使う
            pass
        sev = str(((v.get("database_specific") or {}).get("severity")) or "")
        out.append({
            "id": v.get("id", ""), "aliases": v.get("aliases", []) or [], "summary": v.get("summary") or (v.get("details") or "")[:200],
            "modified": str(v.get("modified", ""))[:19], "published": str(v.get("published", ""))[:10],
            "fixed": sorted(set(fixed)), "severity": sev,
            "url": f"https://osv.dev/vulnerability/{v.get('id', '')}",
        })
    return out


# ---------------------------------------------------------------- 通知
def gh_issue(repo, token, title, body, labels):
    if not repo or not token:
        return None
    url = f"https://api.github.com/repos/{repo}/issues"
    r = http_json(url, data={"title": title, "body": body, "labels": labels},
                  headers={"Authorization": f"Bearer {token}", "X-GitHub-Api-Version": "2022-11-28"})
    return (r or {}).get("html_url")


def send_mail(subject, body):
    host = os.environ.get("SMTP_HOST", "").strip()
    user = os.environ.get("SMTP_USER", "").strip()
    pw = os.environ.get("SMTP_PASS", "")
    to = [x.strip() for x in os.environ.get("MAIL_TO", "").split(",") if x.strip()]
    sender = os.environ.get("MAIL_FROM", "").strip() or user
    port = int(os.environ.get("SMTP_PORT", "465") or 465)
    if not (host and user and pw and to):
        print("[mail] SMTP_HOST/SMTP_USER/SMTP_PASS/MAIL_TO が未設定のためメールは送りません")
        return False
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = formataddr((str(Header("Vietnam.pj セキュリティ監視", "utf-8")), sender))
    msg["To"] = ", ".join(to)
    if port == 465:
        with smtplib.SMTP_SSL(host, port, timeout=60) as s:
            s.login(user, pw)
            s.sendmail(sender, to, msg.as_string())
    else:
        with smtplib.SMTP(host, port, timeout=60) as s:
            s.ehlo(); s.starttls(); s.ehlo()
            s.login(user, pw)
            s.sendmail(sender, to, msg.as_string())
    print(f"[mail] sent to {', '.join(to)}")
    return True


# ---------------------------------------------------------------- メイン
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--days", type=int, default=None)
    args = ap.parse_args()

    inv = json.load(open(INVENTORY, encoding="utf-8"))
    default_min = float(inv.get("defaults", {}).get("minScore", 7.0))
    items = inv["items"]

    state = {"lastRun": "", "known": {}}
    if os.path.exists(STATE):
        state = json.load(open(STATE, encoding="utf-8"))
    now = datetime.now(timezone.utc)
    lookback = args.days or int(os.environ.get("LOOKBACK_DAYS", "7") or 7)
    since = state.get("lastRun") or (now - timedelta(days=lookback)).isoformat()
    print(f"[run] since={since} items={len(items)}")

    # ---- 1. cvelistV5 deltaLog → 変更 CVE
    delta = http_json(DELTA_LOG_URL, timeout=120) or []
    changed = {}
    for e in delta:
        if str(e.get("fetchTime", "")) < since:
            continue
        for k in ("new", "updated"):
            for x in e.get(k, []) or []:
                cid = x.get("cveId")
                if cid and x.get("githubLink"):
                    changed[cid] = x["githubLink"]
    ids = sorted(changed)
    print(f"[cve] changed records: {len(ids)}")
    if len(ids) > MAX_RECORDS:
        print(f"[cve] too many ({len(ids)}), truncating to {MAX_RECORDS}")
        ids = ids[-MAX_RECORDS:]

    def fetch(cid):
        try:
            rec = http_json(changed[cid], timeout=60)
            return cid, (cve_fields(rec) if rec else None)
        except Exception as ex:  # noqa: BLE001
            return cid, {"error": str(ex)}
    fetched, errors = {}, 0
    with ThreadPoolExecutor(max_workers=12) as pool:
        for cid, f in pool.map(fetch, ids):
            if f is None:
                continue
            if "error" in f:
                errors += 1
                continue
            fetched[cid] = f
    print(f"[cve] fetched={len(fetched)} errors={errors}")

    findings = []   # dict(kind, item, cve, strength, reason, level)
    for cid, f in fetched.items():
        if f["state"].upper() == "REJECTED":
            continue
        for item in items:
            strength, reason = match_item(f, item)
            if not strength:
                continue
            min_score = float(item.get("minScore", default_min))
            urgent = f["kev"] or (f["score"] is not None and f["score"] >= min_score)
            level = "要対応" if (urgent and strength == "strong") else "情報"
            findings.append({"kind": "cve", "item": item, "f": f, "strength": strength, "reason": reason, "level": level})
            break  # 1 CVE は最初に一致した対象に付ける

    # ---- 2. OSV (npm パッケージ)
    osv_findings = []
    for item in items:
        for pkg in item.get("osv", []) or []:
            try:
                vulns = osv_vulns(pkg["ecosystem"], pkg["name"])
            except Exception as ex:  # noqa: BLE001
                print(f"[osv] {pkg['name']}: {ex}")
                continue
            for v in vulns:
                if v["modified"] and v["modified"] < since[:19]:
                    continue
                level = "要対応" if v["severity"].upper() in ("HIGH", "CRITICAL") else "情報"
                osv_findings.append({"kind": "osv", "item": item, "pkg": pkg, "v": v, "level": level})
    print(f"[match] cve={len(findings)} osv={len(osv_findings)}")

    # ---- 3. 既知と突合 (同じ CVE でも dateUpdated が変われば再通知)
    known = state.get("known", {})
    new_f, new_o = [], []
    for x in findings:
        key = x["f"]["id"]
        fp = f"{x['f']['updated']}|{x['f']['score']}|{x['f']['kev']}|{x['level']}"
        if known.get(key) != fp:
            new_f.append(x)
            known[key] = fp
    for x in osv_findings:
        key = "osv:" + x["v"]["id"]
        fp = x["v"]["modified"]
        if known.get(key) != fp:
            new_o.append(x)
            known[key] = fp
    urgent_n = sum(1 for x in new_f + new_o if x["level"] == "要対応")
    info_n = len(new_f) + len(new_o) - urgent_n
    print(f"[new] 要対応={urgent_n} 情報={info_n}")

    # ---- 4. レポート本文
    today = now.astimezone(JST).strftime("%Y-%m-%d %H:%M JST")
    lines = [f"# セキュリティ監視 {today}", "",
             f"- 対象期間: {since[:19]}Z 以降 / 変更 CVE {len(ids)} 件を照合",
             f"- 新規検知: 要対応 {urgent_n} 件 / 情報 {info_n} 件", ""]
    def fmt_cve(x):
        f, it = x["f"], x["item"]
        sc = f"CVSS {f['score']:.1f}" if f["score"] is not None else "CVSS 未評価"
        kev = " **KEV(悪用確認)**" if f["kev"] else ""
        return [f"### [{x['level']}] {f['id']} — {it['label']}",
                f"- {sc}{kev} / 公開 {f['published']} / 更新 {f['updated']}Z / 一致: {x['reason']} ({x['strength']})",
                f"- {f['title'] or f['desc'][:160]}",
                f"- 使用状況: {it.get('inUse', '')}",
                f"- 対応: {it.get('action', '')}",
                f"- https://www.cve.org/CVERecord?id={f['id']}", ""]
    def fmt_osv(x):
        v, it, pkg = x["v"], x["item"], x["pkg"]
        return [f"### [{x['level']}] {v['id']} — {pkg['ecosystem']}:{pkg['name']}",
                f"- 重要度 {v['severity'] or '不明'} / 公開 {v['published']} / 更新 {v['modified']}Z / 修正版: {', '.join(v['fixed']) or '不明'} / 別名: {', '.join(v['aliases'][:3])}",
                f"- {v['summary'][:200]}",
                f"- 使用状況: {it.get('inUse', '')}",
                f"- 対応: {it.get('action', '')}",
                f"- {v['url']}", ""]
    for lvl in ("要対応", "情報"):
        block = [l for x in new_f if x["level"] == lvl for l in fmt_cve(x)] + \
                [l for x in new_o if x["level"] == lvl for l in fmt_osv(x)]
        if block:
            lines += [f"## {lvl}", ""] + block
    if not new_f and not new_o:
        lines += ["新規の該当はありません。", ""]
    report = "\n".join(lines)
    print(report)

    if args.dry_run:
        print("[dry-run] Issue/メール/state/log は更新しません")
        return 0

    # ---- 5. Issue + メール (新規検知があるときだけ)
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    token = os.environ.get("GITHUB_TOKEN", "")
    issue_url = None
    if new_f or new_o:
        title = f"[security-watch] 要対応 {urgent_n} 件 / 情報 {info_n} 件 ({now.astimezone(JST).strftime('%Y-%m-%d')})"
        try:
            issue_url = gh_issue(repo, token, title, report, ["security"])
            print(f"[issue] {issue_url}")
        except Exception as ex:  # noqa: BLE001
            print(f"[issue] failed: {ex}")
        subject = f"[Vietnam.pj セキュリティ監視] 要対応 {urgent_n} 件 / 情報 {info_n} 件 ({now.astimezone(JST).strftime('%m/%d')})"
        body = report + ("\n\nGitHub Issue: " + issue_url if issue_url else "")
        try:
            send_mail(subject, body)
        except Exception as ex:  # noqa: BLE001
            print(f"[mail] failed: {ex}")

    # ---- 6. ログと state
    os.makedirs(LOG_DIR, exist_ok=True)
    logp = os.path.join(LOG_DIR, now.astimezone(JST).strftime("%Y-%m") + ".md")
    with open(logp, "a", encoding="utf-8") as fh:
        fh.write(report + (f"\nIssue: {issue_url}\n" if issue_url else "") + "\n---\n\n")
    state["lastRun"] = now.isoformat()
    # 90 日以上更新されていない既知エントリは捨てる (肥大化防止)
    state["known"] = known
    state["lastRunHuman"] = today
    json.dump(state, open(STATE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
