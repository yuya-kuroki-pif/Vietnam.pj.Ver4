# セキュリティ監視 (security-watch)

毎日 07:30 JST に GitHub Actions が [CVEProject/cvelistV5](https://github.com/CVEProject/cvelistV5) と
[OSV.dev](https://osv.dev) を確認し、このシステムが使っている製品・パッケージに関する脆弱性を
GitHub Issue とメールで知らせる仕組みです。

## 構成

| ファイル | 役割 |
|---|---|
| `inventory.json` | 依存台帳。監視対象 (vendor / product の正規表現、OSV パッケージ、使用状況、対応手順) |
| `security_watch.py` | 収集・照合・通知・記録のスクリプト (Python 標準ライブラリのみ) |
| `state.json` | 前回実行時刻と既知の CVE (自動更新。手で編集しない) |
| `log/YYYY-MM.md` | 毎回の確認結果 (監査証跡) |
| `../.github/workflows/security-watch.yml` | スケジュール実行 |

## 判定ルール

- cvelistV5 の `deltaLog.json` から前回実行以降に追加・更新された CVE を取り、レコードの
  `affected.vendor / product / packageName / CPE` を台帳の正規表現と照合 (strong)。
  説明文のキーワードだけの一致は weak。
- **要対応**: strong 一致で CVSS 7.0 以上 (台帳の `minScore` で変更可)、または CISA の KEV (悪用確認済み)。
- **情報**: 上記以外の一致。
- OSV: npm パッケージ (`@supabase/supabase-js`, `firebase-tools`) は OSV の重要度 HIGH / CRITICAL を要対応。
- 同じ CVE でも `dateUpdated` やスコアが変わると再通知する (state.json のフィンガープリントで判定)。

## 通知

1. **GitHub Issue**: 新規検知があった実行ごとに 1 件起票 (ラベル `security`)。リポジトリを Watch していれば GitHub からもメールが届く。
2. **メール (SMTP)**: リポジトリの Secrets に次を設定すると送信する。未設定なら Issue のみ。

| Secret | 内容 | 例 (Google Workspace) |
|---|---|---|
| `SMTP_HOST` | SMTP サーバー | `smtp.gmail.com` |
| `SMTP_PORT` | ポート (465=SSL / 587=STARTTLS) | `465` |
| `SMTP_USER` | ログインユーザー | 送信に使うアカウントのメールアドレス |
| `SMTP_PASS` | パスワード | Google の場合は **アプリパスワード** (2 段階認証を有効にして発行) |
| `MAIL_FROM` | 差出人 (省略時は SMTP_USER) | |
| `MAIL_TO` | 宛先 (カンマ区切りで複数可) | |

設定場所: GitHub → リポジトリ → Settings → Secrets and variables → Actions → New repository secret。

## 運用ルール

- 要対応 Issue は 7 日以内に対応方針を決める。KEV は 48 時間以内。
- 対応が終わったら Issue を閉じる。`log/` は消さない。
- 四半期に 1 回 `inventory.json` を見直す (新しい依存の追加、バージョンの更新、不要になった対象の削除)。
- 手動実行: Actions → security-watch → Run workflow。`dry_run=true` で通知なしの確認ができる。

## ローカルで試す

```bash
python security/security_watch.py --dry-run --days 3
```
