import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE = (process.env.E2E_BASE || "http://localhost:3100").replace(/\/$/, "");
// الروابط في الصفحة مطلقة وتحمل basePath أصلًا، فتُحلّ على الأصل لا على BASE
const ORIGIN = new URL(BASE).origin;
const errors = [];
let passed = 0;
const ok = (n) => { passed++; console.log("  ✓ " + n); };

const EXEC = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch(EXEC ? { executablePath: EXEC } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") errors.push(`[console] ${page.url()} :: ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`[pageerror] ${page.url()} :: ${e.message}`));

console.log("الصفحات الأساسية:");
for (const path of ["/", "/learn", "/bank", "/exam/setup", "/exam/run", "/weakness", "/mistakes", "/history", "/settings"]) {
  const res = await page.goto(BASE + path, { waitUntil: "networkidle" });
  assert.equal(res.status(), 200, path);
  const text = await page.locator("body").innerText();
  assert.ok(text.length > 200, `صفحة ${path} فيها محتوى حقيقي`);
  ok(`${path} تُحمّل بمحتوى (${text.length} حرفًا)`);
}

await page.goto(BASE + "/", { waitUntil: "networkidle" });
assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
assert.equal(await page.locator("html").getAttribute("lang"), "ar");
ok("اتجاه الصفحة RTL واللغة عربية");

// عرض العبرية داخل عنصر معزول
await page.goto(BASE + "/learn/binyan-hitpael", { waitUntil: "networkidle" });
const heCount = await page.locator(".he, .he-block").count();
assert.ok(heCount > 5, "عناصر عبرية معزولة");
const heStyle = await page.locator(".he").first().evaluate((el) => getComputedStyle(el).unicodeBidi);
assert.ok(["isolate", "-webkit-isolate"].includes(heStyle), heStyle);
ok(`العبرية معروضة في ${heCount} عنصرًا معزولًا (unicode-bidi: ${heStyle})`);

// تمرين داخل الدرس
const hintBtns = page.locator("button", { hasText: "إظهار التلميح" });
const hintCount = await hintBtns.count();
assert.ok(hintCount >= 2, `تمارين الدرس: ${hintCount}`);
await hintBtns.first().click();
assert.ok((await page.locator("p", { hasText: "💡" }).count()) > 0, "التلميح ظهر");
ok(`التلميح يظهر قبل الحل في تمارين الدرس (${hintCount} تمرينًا)`);
const exBlock = page.locator("[data-testid='exercise']").first();
await exBlock.locator("div.grid button").first().click();
const exText = await exBlock.innerText();
assert.ok(/إجابة صحيحة|إجابة خاطئة/.test(exText), exText.slice(0, 200));
assert.ok(exText.includes("إعادة المحاولة"));
ok("تمرين الدرس يعطي تصحيحًا وشرحًا فوريًا مع إعادة المحاولة");

// إكمال الدرس
await page.locator("button", { hasText: "تحديد كمكتمل" }).click();
await page.goto(BASE + "/learn", { waitUntil: "networkidle" });
assert.ok((await page.locator("text=مكتمل").count()) > 0);
ok("حالة إكمال الدرس محفوظة وتظهر في القائمة");

// امتحان كامل
await page.goto(BASE + "/exam/setup", { waitUntil: "networkidle" });
await page.locator("button", { hasText: "امتحان سريع" }).click();
await page.locator("button", { hasText: "ابدأ الامتحان" }).click();
await page.waitForURL(/\/exam\/run\/?(\?|$)/);
await page.waitForSelector("article.card");

async function answerCurrent(deliberatelyWrong) {
  const art = page.locator("article.card").first();
  const fieldBoxes = art.locator("div.rounded-xl.border.border-ink-200").filter({ has: page.locator("button") });
  const input = art.locator("input.input");
  if (await input.count()) {
    await input.fill(deliberatelyWrong ? "שגוי" : "נכתב");
    return "write";
  }
  const nFields = await fieldBoxes.count();
  if (nFields > 0) {
    for (let i = 0; i < nFields; i++) {
      const btns = fieldBoxes.nth(i).locator("button");
      const c = await btns.count();
      await btns.nth(deliberatelyWrong ? 0 : Math.min(1, c - 1)).click();
    }
    return "fields";
  }
  const opts = art.locator("div.grid button");
  const c = await opts.count();
  if (c > 0) {
    await opts.nth(deliberatelyWrong ? 0 : Math.max(0, c - 1)).click();
    return "mcq";
  }
  return "none";
}

const seen = new Set();
const totalQ = Number((await page.locator("text=/سؤال 1 من \\d+/").first().innerText()).match(/من (\d+)/)[1]);
assert.equal(totalQ, 10);
for (let i = 0; i < totalQ; i++) {
  const kind = await answerCurrent(i % 3 === 0);
  seen.add(kind);
  if (i < totalQ - 1) await page.locator("button", { hasText: "التالي ←" }).first().click();
}
assert.ok(!seen.has("none"), "كل الأسئلة قابلة للإجابة");
ok(`أُجيبت 10 أسئلة بأنواع: ${[...seen].join("، ")}`);

// التنقل وتغيير الإجابة قبل التسليم
await page.locator("button[aria-label='السؤال 1']").click();
assert.ok((await page.locator("text=سؤال 1 من 10").count()) > 0);
ok("التنقل بين الأسئلة يعمل");

// الحفظ التلقائي: إعادة تحميل الصفحة
const beforeReload = await page.locator("text=/\\d+\\/10 مُجاب/").first().innerText();
await page.reload({ waitUntil: "networkidle" });
const afterReload = await page.locator("text=/\\d+\\/10 مُجاب/").first().innerText();
assert.equal(afterReload, beforeReload, `${beforeReload} != ${afterReload}`);
ok(`الإجابات محفوظة تلقائيًا بعد إعادة التحميل (${afterReload})`);

// لا تُعرض الإجابة الصحيحة قبل التسليم في وضع الامتحان
const runBody = await page.locator("body").innerText();
assert.ok(!runBody.includes("الإجابة الصحيحة"), "لا كشف للإجابة قبل التسليم");
assert.ok(!runBody.includes("لماذا هذه الإجابة؟"));
ok("لا تُكشف الإجابة الصحيحة قبل التسليم");

// التسليم
await page.locator("button", { hasText: "تسليم الامتحان" }).click();
await page.locator("button", { hasText: "تسليم ونتيجة" }).click();
await page.waitForURL(/\/exam\/results\/?(\?|$)/);
const resultsText = await page.locator("body").innerText();
const score = Number(resultsText.match(/من 100/) ? resultsText.match(/(\d+)\s*\n?\s*من 100/)?.[1] ?? NaN : NaN);
assert.ok(Number.isFinite(score) && score >= 0 && score <= 100, `علامة صالحة: ${score}`);
assert.ok(resultsText.includes("التصحيح التفصيلي"));
assert.ok(resultsText.includes("لماذا هذه الإجابة؟"));
assert.ok(resultsText.includes("العلامة لكل موضوع"));
assert.ok(resultsText.includes("فتح الدرس"));
ok(`صفحة النتائج تعرض العلامة ${score}/100 والتصحيح التفصيلي وروابط الدروس`);

// لوحة التحكم تُحدَّث
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const dash = await page.locator("body").innerText();
assert.ok(dash.includes(`${score}/100`), `آخر علامة ${score} ظاهرة في اللوحة`);
assert.ok(/عدد الأسئلة المحلولة/.test(dash));
ok("لوحة التحكم تعرض آخر علامة وعدد الأسئلة المحلولة");

// سجل الامتحانات
await page.goto(BASE + "/history", { waitUntil: "networkidle" });
assert.ok((await page.locator("text=امتحان سريع").count()) > 0);
ok("الامتحان مسجّل في سجل الامتحانات");

// دفتر الأخطاء
await page.goto(BASE + "/mistakes", { waitUntil: "networkidle" });
const mistakesText = await page.locator("body").innerText();
assert.ok(/أخطأت \d+ مرة/.test(mistakesText) || mistakesText.includes("دفتر الأخطاء فارغ"));
if (/أخطأت/.test(mistakesText)) {
  assert.ok(mistakesText.includes("مستحقّ المراجعة"));
  ok("دفتر الأخطاء يحفظ الأخطاء مع بيانات المراجعة المتباعدة");
} else {
  ok("دفتر الأخطاء فارغ (كل الإجابات صحيحة)");
}

// نقاط الضعف
await page.goto(BASE + "/weakness", { waitUntil: "networkidle" });
const weak = await page.locator("body").innerText();
assert.ok(weak.includes("ثقة التقييم"));
assert.ok(weak.includes("خطة مراجعة مقترحة"));
ok("صفحة نقاط الضعف تعرض درجة الثقة وخطة المراجعة");

// التصدير/الاستيراد
await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
const dl = page.waitForEvent("download");
await page.locator("button", { hasText: "تصدير نسخة احتياطية" }).click();
const file = await dl;
assert.ok((await file.path()).length > 0);
ok(`تصدير النسخة الاحتياطية يعمل (${file.suggestedFilename()})`);

// فلترة بنك الأسئلة
await page.goto(BASE + "/bank", { waitUntil: "networkidle" });
await page.selectOption("#f-binyan", "hufal");
await page.waitForTimeout(300);
const bankText = await page.locator("body").innerText();
assert.ok(/النتائج: \d+/.test(bankText));
await page.locator("button", { hasText: "إظهار الحل والشرح" }).first().click();
assert.ok((await page.locator("text=لماذا هذه الإجابة؟").count()) > 0);
ok("فلترة بنك الأسئلة وإظهار الشرح يعملان");

// كل روابط التنقل
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const navLinks = await page.locator("header nav a").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
for (const href of navLinks) {
  const res = await page.goto(new URL(href, ORIGIN).href, { waitUntil: "domcontentloaded" });
  assert.equal(res.status(), 200, href);
}
ok(`كل روابط شريط التنقل تعمل (${navLinks.length} رابطًا)`);


// =====================================================================
// امتحان مخصص: موضوع واحد + صعوبة + مؤقت + تلميحات + تصحيح فوري
// =====================================================================
await page.goto(BASE + "/exam/setup", { waitUntil: "networkidle" });
// اختيار موضوع واحد فقط (الجذر) ينقل الوضع تلقائيًا إلى «مخصص»
await page.locator("button", { hasText: "שורש — الجذر" }).first().click();
// صعوبة: سهل (نص مطابق تمامًا حتى لا يلتقط «صعب جدًا»)
await page.locator("button").filter({ hasText: /^سهل$/ }).first().click();
// مؤقت 10 دقائق
await page.locator("button", { hasText: "10 دقيقة" }).first().click();
// عدد أسئلة صغير
await page.locator("#count").fill("5");
const setupText = await page.locator("body").innerText();
assert.ok(/متاح بهذه الإعدادات: \d+ سؤالًا/.test(setupText), setupText.slice(0, 300));
// تأكيد تفعيل التلميحات والتصحيح الفوري
for (const label of ["إظهار التلميحات أثناء الحل", "تصحيح فوري بعد كل سؤال"]) {
  const row = page.locator("label", { hasText: label }).first();
  const box = row.locator("input[type='checkbox']");
  if (!(await box.isChecked())) await row.click();
  assert.ok(await box.isChecked(), label);
}
await page.locator("button", { hasText: "ابدأ الامتحان" }).click();
await page.waitForURL(/\/exam\/run\/?(\?|$)/);
await page.waitForSelector("article.card");
assert.ok((await page.locator("text=/سؤال 1 من 5/").count()) > 0, "عدد الأسئلة المخصص مُحترم");
ok("الامتحان المخصص يحترم الموضوع والصعوبة وعدد الأسئلة");

// المؤقت ظاهر ويعدّ تنازليًا
const clock1 = await page.locator("text=/⏱ \\d+:\\d+/").first().innerText();
await page.waitForTimeout(1600);
const clock2 = await page.locator("text=/⏱ \\d+:\\d+/").first().innerText();
assert.notEqual(clock1, clock2, `المؤقت لا يتحرك: ${clock1}`);
ok(`المؤقت يعمل ويعدّ تنازليًا (${clock1} ← ${clock2})`);

// التلميح متاح أثناء الامتحان
assert.ok((await page.locator("button", { hasText: "إظهار التلميح" }).count()) > 0);
ok("التلميحات متاحة أثناء الامتحان عند تفعيلها");

// التصحيح الفوري: لا يُكشف قبل الإجابة، ويُكشف بعد «تحقّق من الإجابة»
assert.equal(await page.locator("button", { hasText: "تحقّق من الإجابة" }).first().isDisabled(), true);
assert.ok(!(await page.locator("body").innerText()).includes("لماذا هذه الإجابة؟"));
await answerCurrent(true);
await page.locator("button", { hasText: "تحقّق من الإجابة" }).first().click();
const afterCheck = await page.locator("body").innerText();
assert.ok(afterCheck.includes("لماذا هذه الإجابة؟"), "الشرح ظهر بعد التحقق");
assert.ok(/إجابة صحيحة|إجابة خاطئة/.test(afterCheck));
ok("التصحيح الفوري يعمل بعد الإجابة فقط، لا قبلها");

// تسليم هذا الامتحان ثم استخدام أزرار صفحة النتائج
for (let i = 1; i < 5; i++) {
  await page.locator("button", { hasText: "التالي ←" }).first().click();
  await answerCurrent(true);
}
await page.locator("button", { hasText: "تسليم الامتحان" }).click();
await page.locator("button", { hasText: "تسليم ونتيجة" }).click();
await page.waitForURL(/\/exam\/results\/?(\?|$)/);
const retryBtn = page.locator("button", { hasText: "إعادة حل الأسئلة الخاطئة" }).first();
const retryLabel = await retryBtn.innerText();
const wrongCount = Number(retryLabel.match(/\((\d+)\)/)[1]);
assert.ok(wrongCount > 0, `يوجد أخطاء لإعادة حلها: ${retryLabel}`);
await retryBtn.click();
await page.waitForURL(/\/exam\/run\/?(\?|$)/);
await page.waitForSelector("article.card");
const retryTotal = Number((await page.locator("text=/سؤال 1 من \\d+/").first().innerText()).match(/من (\d+)/)[1]);
assert.equal(retryTotal, wrongCount, "امتحان إعادة الأخطاء يحتوي الأسئلة الخاطئة فقط");
ok(`زر «إعادة حل الأسئلة الخاطئة» يبني امتحانًا من ${wrongCount} سؤالًا خاطئًا`);

// زر «امتحان جديد من المواضيع الضعيفة» من صفحة النتائج
await page.goBack({ waitUntil: "networkidle" });
await page.locator("a", { hasText: "امتحان جديد من المواضيع الضعيفة" }).click();
await page.waitForURL(/\/exam\/setup\/?(\?|$)/);
assert.ok((await page.locator("body").innerText()).includes("إعداد الامتحان"));
ok("زر «امتحان جديد من المواضيع الضعيفة» ينقل لإعداد امتحان مهيّأ");

// خطة المراجعة في صفحة نقاط الضعف تعمل كروابط حقيقية
await page.goto(BASE + "/weakness", { waitUntil: "networkidle" });
const planLinks = await page.locator("ol li a").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
assert.ok(planLinks.length >= 4, `خطوات الخطة: ${planLinks.length}`);
for (const href of planLinks) {
  const res = await page.goto(new URL(href, ORIGIN).href, { waitUntil: "domcontentloaded" });
  assert.equal(res.status(), 200, href);
}
ok(`كل خطوات خطة المراجعة روابط عاملة (${planLinks.length} خطوة)`);

// استيراد نسخة احتياطية
await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
const before = await page.locator("body").innerText();
const beforeAnswers = Number(before.match(/إجابات مسجّلة\n+(\d+)/)?.[1] ?? "-1");
assert.ok(beforeAnswers > 0, `إجابات مسجّلة قبل التصدير: ${beforeAnswers}`);
const dl2 = page.waitForEvent("download");
await page.locator("button", { hasText: "تصدير نسخة احتياطية" }).click();
const backupPath = await (await dl2).path();
// امسح كل البيانات ثم استورد
await page.locator("button", { hasText: "حذف كل البيانات" }).click();
await page.locator("button", { hasText: "نعم، احذف الكل" }).click();
await page.waitForTimeout(300);
const cleared = Number((await page.locator("body").innerText()).match(/إجابات مسجّلة\n+(\d+)/)?.[1] ?? "-1");
assert.equal(cleared, 0, "الحذف صفّر البيانات");
await page.locator("input[type='file']").setInputFiles(backupPath);
await page.waitForTimeout(500);
const restored = Number((await page.locator("body").innerText()).match(/إجابات مسجّلة\n+(\d+)/)?.[1] ?? "-1");
assert.equal(restored, beforeAnswers, `الاستيراد أعاد ${restored} من ${beforeAnswers}`);
ok(`الحذف ثم الاستيراد يعيدان البيانات كما كانت (${restored} إجابة)`);

// الهاتف
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await mobile.newPage();
mp.on("pageerror", (e) => errors.push(`[mobile pageerror] ${e.message}`));
mp.on("console", (m) => { if (m.type() === "error") errors.push(`[mobile console] ${m.text()}`); });
for (const path of ["/", "/learn/binyan-nifal", "/bank", "/exam/setup", "/weakness"]) {
  await mp.goto(BASE + path, { waitUntil: "networkidle" });
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 2, `${path} بلا تمرير أفقي (فرق ${overflow}px)`);
}
ok("لا يوجد تمرير أفقي على عرض 390px في الصفحات الرئيسية");
await mp.goto(BASE + "/", { waitUntil: "networkidle" });
await mp.locator("button[aria-label='القائمة']").click();
assert.ok((await mp.locator("nav a", { hasText: "نقاط ضعفي" }).count()) > 0);
ok("قائمة الهاتف تفتح وتعرض كل الروابط");


// =====================================================================
// الآيفون والآيباد: PWA، أيقونة الشاشة الرئيسية، والعمل بلا إنترنت
// =====================================================================
const IPHONE = { width: 390, height: 844, name: "آيفون" };
const IPAD = { width: 820, height: 1180, name: "آيباد" };

for (const dev of [IPHONE, IPAD]) {
  const c = await browser.newContext({ viewport: { width: dev.width, height: dev.height }, isMobile: dev === IPHONE, hasTouch: true });
  const dp = await c.newPage();
  dp.on("pageerror", (e) => errors.push(`[${dev.name} pageerror] ${e.message}`));
  dp.on("console", (m) => { if (m.type() === "error") errors.push(`[${dev.name} console] ${m.text()}`); });
  for (const path of ["/", "/learn/binyan-hitpael/", "/exam/setup/", "/bank/", "/weakness/", "/settings/"]) {
    await dp.goto(BASE + path, { waitUntil: "networkidle" });
    const over = await dp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(over <= 2, `${dev.name} ${path} بلا تمرير أفقي (فرق ${over}px)`);
  }
  // حقول الكتابة 16px على الأقل، وإلا يكبّر iOS الصفحة تلقائيًا عند اللمس
  await dp.goto(BASE + "/bank/", { waitUntil: "networkidle" });
  const sizes = await dp.locator("input, select").evaluateAll((els) =>
    els.map((e) => parseFloat(getComputedStyle(e).fontSize)),
  );
  assert.ok(sizes.length > 0 && sizes.every((s) => s >= 16), `أحجام الخط: ${sizes.join(",")}`);
  await c.close();
  ok(`${dev.name}: كل الصفحات بلا تمرير أفقي وحقول الكتابة لا تُكبّر الصفحة`);
}

// بيانات «إضافة إلى الشاشة الرئيسية»
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const head = await page.evaluate(() => ({
  manifest: document.querySelector("link[rel=manifest]")?.getAttribute("href") ?? null,
  apple: document.querySelector("link[rel=apple-touch-icon]")?.getAttribute("href") ?? null,
  capable: document.querySelector("meta[name='apple-mobile-web-app-capable']")?.getAttribute("content") ?? null,
  capableModern: document.querySelector("meta[name='mobile-web-app-capable']")?.getAttribute("content") ?? null,
  appTitle: document.querySelector("meta[name='apple-mobile-web-app-title']")?.getAttribute("content") ?? null,
  theme: document.querySelector("meta[name=theme-color]")?.getAttribute("content") ?? null,
  viewport: document.querySelector("meta[name=viewport]")?.getAttribute("content") ?? null,
}));
assert.ok(head.manifest, "رابط manifest موجود");
assert.ok(head.apple, "أيقونة apple-touch-icon موجودة");
// الصيغتان مطلوبتان: الحديثة لسفاري الجديد، والقديمة لإصدارات iOS الأقدم
assert.equal(head.capable, "yes");
assert.equal(head.capableModern, "yes");
assert.ok(head.appTitle, "اسم التطبيق على الشاشة الرئيسية");
assert.equal(head.theme, "#1559b5");
assert.ok(head.viewport.includes("viewport-fit=cover"), head.viewport);
ok(`بيانات التطبيق كاملة (manifest + أيقونة آيفون + اسم «${head.appTitle}»)`);

// الـ manifest نفسه صالح وأيقوناته موجودة فعلًا
const manUrl = new URL(head.manifest, BASE + "/").href;
const manRes = await page.request.get(manUrl);
assert.equal(manRes.status(), 200);
const man = await manRes.json();
assert.equal(man.display, "standalone");
assert.ok(man.start_url.endsWith("/"), man.start_url);
assert.ok(man.icons.length >= 3);
assert.ok(man.icons.some((i) => i.purpose === "maskable"));
for (const ic of [...man.icons, { src: head.apple }]) {
  const r = await page.request.get(new URL(ic.src, BASE + "/").href);
  assert.equal(r.status(), 200, ic.src);
  assert.ok((await r.body()).length > 500, `${ic.src} ليست فارغة`);
}
ok(`manifest صالح (standalone) وكل الأيقونات (${man.icons.length + 1}) موجودة`);

// العمل بلا إنترنت عبر Service Worker
const off = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const op = await off.newPage();
await op.goto(BASE + "/", { waitUntil: "networkidle" });
const swReady = await op.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return "unsupported";
  const reg = await navigator.serviceWorker.ready;
  return reg.active ? "active" : "inactive";
});
assert.equal(swReady, "active", "Service Worker مفعّل");
// زيارة الصفحات مرة واحدة متصلًا حتى تُحفظ
for (const p of ["/learn/", "/learn/binyan-paal/", "/exam/setup/", "/bank/"]) {
  await op.goto(BASE + p, { waitUntil: "networkidle" });
}
await op.waitForTimeout(800);

await off.setOffline(true);
await op.goto(BASE + "/", { waitUntil: "domcontentloaded" });
const offlineHome = await op.locator("body").innerText();
assert.ok(offlineHome.includes("لوحة التحكم"), `الرئيسية بلا إنترنت: ${offlineHome.slice(0, 120)}`);
await op.goto(BASE + "/learn/binyan-paal/", { waitUntil: "domcontentloaded" });
const offlineLesson = await op.locator("body").innerText();
assert.ok(offlineLesson.length > 500, "الدرس يُعرض بلا إنترنت");
// التفاعل يعمل بلا إنترنت (الـ JS محفوظ أيضًا)
await op.locator("button", { hasText: "إظهار التلميح" }).first().click();
assert.ok((await op.locator("p", { hasText: "💡" }).count()) > 0, "التمارين تعمل بلا إنترنت");
await off.setOffline(false);
await off.close();
ok("الموقع يفتح ويشتغل بلا إنترنت بعد أول زيارة (Service Worker)");

await browser.close();

if (errors.length) {
  console.error("\n✗ أخطاء console/صفحة:");
  for (const e of [...new Set(errors)]) console.error("  " + e);
  process.exit(1);
}
console.log(`\n✓ نجحت ${passed} حالة اختبار في المتصفح، وبلا أخطاء في الـ console.`);
