/**
 * يولّد أيقونات PNG من تصميم SVG واحد (للـ PWA وشاشة آيفون/آيباد الرئيسية).
 * التشغيل: node scripts/make-icons.mjs   (يحتاج Chromium عبر Playwright)
 * المتغيّر CHROMIUM_PATH اختياري لتحديد مسار المتصفح.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "public/icons";
await mkdir(OUT, { recursive: true });

const FONTS =
  "https://fonts.googleapis.com/css2?family=Cairo:wght@700&family=Frank+Ruhl+Libre:wght@700&display=swap";

/** التصميم دائمًا على شبكة 512، وحجم الإخراج يتحكم به width/height فقط. */
function svg({ size, radius }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#1559b5"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${radius}" fill="url(#g)"/>
  <text x="256" y="236" text-anchor="middle" dominant-baseline="middle"
        font-family="'Frank Ruhl Libre','David Libre',serif" font-size="210"
        font-weight="700" fill="#ffffff">בנ</text>
  <text x="256" y="392" text-anchor="middle"
        font-family="'Cairo',sans-serif" font-size="58" font-weight="700" fill="#bfdbfe">עברית</text>
</svg>`;
}

const targets = [
  // أيقونة الويب العادية: زوايا مدوّرة في التصميم نفسه
  { name: "icon-192.png", size: 192, radius: 40 },
  { name: "icon-512.png", size: 512, radius: 96 },
  // maskable: مربّع كامل بلا شفافية حتى يقصّه النظام كما يشاء
  { name: "icon-maskable-512.png", size: 512, radius: 0 },
  // iOS يضيف الزوايا المدوّرة بنفسه، فالمصدر مربّع معتم
  { name: "apple-touch-icon.png", size: 180, radius: 0 },
];

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await browser.newPage();

for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8">
     <link rel="stylesheet" href="${FONTS}"></head>
     <body style="margin:0;padding:0;line-height:0">${svg(t)}</body></html>`,
    { waitUntil: "networkidle" },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.locator("svg").screenshot({ path: `${OUT}/${t.name}`, omitBackground: true });
  console.log("✓", t.name, `${t.size}×${t.size}`);
}

await browser.close();
