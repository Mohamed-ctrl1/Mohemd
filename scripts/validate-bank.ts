/**
 * تدقيق بنك الأسئلة. يفشل البناء إذا وُجد سؤال ناقص أو ملتبس.
 * التشغيل: npm run validate
 */
import { QUESTION_BANK, statsByDifficulty, statsByTopic, statsByType } from "../src/data/questionBank";
import { VERB_DATA } from "../src/data/verbs";
import { normalizeAnswer } from "../src/lib/normalize";
import { ruleLabel } from "../src/lib/analysis";

const errors: string[] = [];
const warnings: string[] = [];
const ids = new Set<string>();
const MIN_QUESTIONS = 300;

for (const q of QUESTION_BANK) {
  const where = `[${q.id}]`;
  if (ids.has(q.id)) errors.push(`${where} معرّف مكرر`);
  ids.add(q.id);
  if (!q.prompt?.trim()) errors.push(`${where} بلا نص سؤال`);
  if (!q.explanation?.trim()) errors.push(`${where} بلا شرح`);
  if (!q.hint?.trim()) errors.push(`${where} بلا تلميح`);
  if (!q.ruleId) errors.push(`${where} بلا قاعدة مرتبطة`);
  if (!q.lessonSlug) errors.push(`${where} بلا درس مرتبط`);

  if (q.fields && q.fields.length > 0) {
    for (const f of q.fields) {
      if (f.options.length < 2) errors.push(`${where} حقل ${f.key} خياراته أقل من اثنين`);
      if (!f.options.includes(f.answer)) errors.push(`${where} حقل ${f.key}: الإجابة ليست بين الخيارات`);
      if (new Set(f.options).size !== f.options.length) errors.push(`${where} حقل ${f.key}: خيارات مكررة`);
    }
    continue;
  }

  if (q.options && q.options.length > 0) {
    if (!q.answer) errors.push(`${where} يوجد خيارات بلا إجابة`);
    else if (!q.options.includes(q.answer)) errors.push(`${where} الإجابة ليست بين الخيارات`);
    if (new Set(q.options).size !== q.options.length) errors.push(`${where} خيارات مكررة`);
    if (q.options.length < 2) errors.push(`${where} خيارات أقل من اثنين`);
    // لا يجوز وجود أكثمن خيار صحيح في سؤال الإجابة الواحدة
    const matches = q.options.filter(
      (o) => normalizeAnswer(o) === normalizeAnswer(q.answer ?? ""),
    );
    if (matches.length > 1) errors.push(`${where} أكثر من خيار مطابق للإجابة`);
  } else {
    if (!q.answer?.trim()) errors.push(`${where} سؤال كتابي بلا إجابة`);
  }
}

if (QUESTION_BANK.length < MIN_QUESTIONS) {
  errors.push(`عدد الأسئلة ${QUESTION_BANK.length} أقل من الحد المطلوب ${MIN_QUESTIONS}`);
}

// تدقيق اتساق المولّد مع قاعدة الأفعال: كل إجابة كتابية عبرية يجب أن تكون صيغة موجودة
const KNOWN_FORMS = new Set<string>();
for (const v of VERB_DATA) {
  for (const f of [v.past3ms, v.present3ms, v.future3ms, v.imperative, v.infinitive]) {
    if (f) KNOWN_FORMS.add(f);
  }
  KNOWN_FORMS.add(v.root);
}
for (const q of QUESTION_BANK) {
  if (!q.tags?.includes("generated")) continue;
  if (q.options || q.fields) continue;
  // أسئلة البنيان والزمن إجاباتها أسماء أوزان وأزمنة لا صيغ أفعال
  if (q.type === "write-binyan" || q.type === "write-tense") continue;
  const a = q.answer ?? "";
  const isRoot = q.type === "write-root";
  if (isRoot) {
    if (!VERB_DATA.some((v) => v.root === a)) errors.push(`[${q.id}] جذر غير موجود في القاعدة: ${a}`);
  } else if (!KNOWN_FORMS.has(a)) {
    errors.push(`[${q.id}] صيغة الإجابة غير موجودة في القاعدة: ${a}`);
  }
}

// كل قاعدة يجب أن يكون لها اسم عربي معروض، لا معرّف خام مثل «rule-active-passive»
for (const rid of new Set(QUESTION_BANK.map((q) => q.ruleId))) {
  const label = ruleLabel(rid);
  if (label === rid || /[a-z]{3,}/.test(label)) {
    errors.push(`[${rid}] القاعدة بلا اسم عربي معروض (الناتج: «${label}»)`);
  }
}

// تحذير توازن المواضيع
const byTopic = statsByTopic();
for (const [t, n] of Object.entries(byTopic)) {
  if (n < 10) warnings.push(`الموضوع «${t}» فيه ${n} سؤالًا فقط`);
}

console.log("— إحصاءات بنك الأسئلة —");
console.log("المجموع:", QUESTION_BANK.length);
console.log("حسب الموضوع:", byTopic);
console.log("حسب الصعوبة:", statsByDifficulty());
console.log("حسب النوع:", statsByType());
console.log("عدد الأفعال في القاعدة:", VERB_DATA.length);

if (warnings.length) {
  console.log("\nتحذيرات:");
  for (const w of warnings) console.log(" ! " + w);
}

if (errors.length) {
  console.error("\nأخطاء (" + errors.length + "):");
  for (const e of errors.slice(0, 60)) console.error(" ✗ " + e);
  process.exit(1);
}
console.log("\n✓ بنك الأسئلة سليم.");
