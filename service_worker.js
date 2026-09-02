// Service worker for the kintai PWA.
//
// 戦略:
//   - HTML / JS / CSS / JSON など「コード資産」: network-first
//     → 常に最新版を取りに行き、失敗時のみキャッシュへフォールバック。
//        これにより「更新したのに古い画面のまま」を防ぐ。
//   - 画像など滅多に変わらない資産: cache-first(高速化のため)
//   - API (Apps Script): SW を経由させず、ブラウザ直接通信
//
// 更新時の挙動:
//   1. このファイル自体は HTTP のキャッシュを抑止 → ブラウザは毎回新しい SW を取りに行く
//   2. 新しい SW が検出されたら即 install + activate (skipWaiting + clients.claim)
//   3. 古いキャッシュは activate 時に削除
//   4. ユーザーは「ハードリロードや キャッシュ削除」をしなくても自然に最新版に切り替わる

const CACHE_NAME = "kintai-v38";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./ROBATANARU.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Listen for a "skip waiting" message so the page can force activation.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// Returns true for "code/shell" assets that must always be fresh.
function isCodeAsset(url) {
  return /\.(?:html|js|css|json|map)(?:$|\?)/.test(url) ||
         url.endsWith("/") ||
         url.endsWith("/index.html");
}

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Skip non-http(s) schemes (chrome-extension://, data:, blob:, etc).
  if (!url.startsWith("http://") && !url.startsWith("https://")) return;

  // Skip the API (Supabase / 旧Apps Script) — always direct to network, never cache.
  if (url.indexOf("supabase.co") !== -1 ||
      url.indexOf("script.google.com") !== -1 ||
      url.indexOf("googleusercontent.com") !== -1) {
    return;
  }

  if (event.request.method !== "GET") return;

  // Only handle same-origin requests; let the browser deal with cross-origin.
  if (new URL(url).origin !== self.location.origin) return;

  // Navigation requests (HTML page loads) and code assets → network-first.
  const networkFirst = event.request.mode === "navigate" || isCodeAsset(url);

  if (networkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          // Cache fresh copy for offline fallback.
          if (resp && resp.status === 200 && resp.type === "basic") {
            const clone = resp.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone))
              .catch(() => {});
          }
          return resp;
        })
        .catch(() => caches.match(event.request).then((c) => c || Response.error()))
    );
    return;
  }

  // Other static assets (images, fonts, etc.) → cache-first for speed.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        if (resp && resp.status === 200 && resp.type === "basic") {
          const clone = resp.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone))
            .catch(() => {});
        }
        return resp;
      });
    })
  );
});
