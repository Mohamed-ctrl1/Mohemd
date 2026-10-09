/**
 * Service Worker: يجعل الموقع يعمل بلا إنترنت بعد أول فتحة.
 *
 * الاستراتيجية:
 * - التنقّل بين الصفحات: الشبكة أولًا (حتى تصل آخر نسخة)، وعند انقطاع
 *   الإنترنت نرجع للنسخة المحفوظة، وإن لم تكن محفوظة نرجع للصفحة الرئيسية.
 * - باقي الملفات (JS/CSS/خطوط/صور): الذاكرة أولًا لأن أسماءها تحمل بصمة
 *   فريدة لكل بناء، مع تحديث صامت في الخلفية.
 *
 * ملاحظة: بيانات الطالب في LocalStorage ولا يلمسها هذا الملف إطلاقًا.
 */

const VERSION = "v3";
const CACHE = `hebrew-exam-${VERSION}`;

// نشتق الجذر من نطاق التسجيل نفسه، فيعمل الملف سواء كان الموقع
// على الجذر (محليًا) أو داخل مجلد باسم الريبو (GitHub Pages).
const ROOT = new URL("./", self.registration.scope).pathname;

const SHELL = [
  "",
  "learn/",
  "bank/",
  "exam/setup/",
  "exam/run/",
  "exam/results/",
  "weakness/",
  "mistakes/",
  "history/",
  "settings/",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/apple-touch-icon.png",
].map((p) => ROOT + p);

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // لا نُفشل التثبيت كله إذا تعذّر تحميل ملف واحد
      await Promise.all(
        SHELL.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // التنقّل بين الصفحات: الشبكة أولًا ثم الذاكرة
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          // نخزّن بمفتاح المسار بلا بارامترات حتى تُستعاد صفحة النتائج أيضًا
          cache.put(url.origin + url.pathname, fresh.clone()).catch(() => undefined);
          return fresh;
        } catch {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(url.origin + url.pathname)) ??
            (await cache.match(req)) ??
            (await cache.match(ROOT)) ??
            new Response("غير متصل بالإنترنت، وهذه الصفحة غير محفوظة بعد.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })(),
    );
    return;
  }

  if (!sameOrigin) return;

  // الملفات الثابتة: الذاكرة أولًا مع تحديث صامت
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone()).catch(() => undefined);
          return res;
        })
        .catch(() => undefined);
      return hit ?? (await network) ?? Response.error();
    })(),
  );
});
