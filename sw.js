// يخلي الموقع يفتح حتى لو النت ضعيف أو مقطوع، بعد أول زيارة.
// دايم يجيب أحدث نسخة من السيرفر أول، ولو ما قدر يرجع للنسخة المحفوظة. فأي تعديل تنشره يوصل للناس على طول.
const CACHE = "boxcup-v1";
const CORE = ["./", "index.html", "config.js", "app.js", "motion.js", "motion.css", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "assets/mujahid.jpg", "assets/raad.jpg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  // الخطوط من Google: نحفظها أول مرة ونستخدمها بعدين
  if (u.host === "fonts.googleapis.com" || u.host === "fonts.gstatic.com") {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); return res; })));
    return;
  }
  if (u.origin !== location.origin) return;   // Firebase وغيره يروح للنت مباشرة
  e.respondWith(fetch(r).then(res => {
    if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === "navigate" ? caches.match("./") : Response.error()))));
});
