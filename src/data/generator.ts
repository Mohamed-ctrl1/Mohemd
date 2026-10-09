import { VERB_DATA } from "./verbs";
import { BINYAN_LABEL, BINYAN_ORDER, confusablesOf, VOICE_LABEL } from "./binyanim";
import { seededShuffle } from "@/lib/normalize";
import type { Binyan, Difficulty, Question, Tense, VerbEntry } from "@/lib/types";

/**
 * مولّد أسئلة حتمي (deterministic) مبني على قاعدة الأفعال المدققة فقط.
 * لا يوجد أي توليد عشوائي للمحتوى: العشوائية محصورة في ترتيب الخيارات،
 * وهي مثبّتة بمفتاح نصّي حتى يبقى الترتيب نفسه في كل تشغيل.
 *
 * قبل توليد أي سؤال نفحص الالتباس: إذا كانت الصيغة نفسها تنتمي
 * لأكثر من بنيان أو أكثر من جذر داخل القاعدة، نستثنيها من أسئلة
 * التعرّف، أو نضيف لها سياقًا يحدد المقصود.
 */

type FormKey = "past3ms" | "present3ms" | "future3ms" | "imperative";
const TENSE_OF: Record<FormKey, Tense> = {
  past3ms: "past",
  present3ms: "present",
  future3ms: "future",
  imperative: "imperative",
};

interface FormRef {
  form: string;
  verb: VerbEntry;
  key: FormKey;
  tense: Tense;
}

const ALL_FORMS: FormRef[] = [];
for (const verb of VERB_DATA) {
  for (const key of ["past3ms", "present3ms", "future3ms", "imperative"] as FormKey[]) {
    const form = verb[key];
    if (form) ALL_FORMS.push({ form, verb, key, tense: TENSE_OF[key] });
  }
}

const byForm = new Map<string, FormRef[]>();
for (const f of ALL_FORMS) {
  const list = byForm.get(f.form) ?? [];
  list.push(f);
  byForm.set(f.form, list);
}

/** هل الصيغة تدل على بنيان واحد فقط داخل القاعدة؟ */
function uniqueBinyan(form: string): boolean {
  const list = byForm.get(form) ?? [];
  return new Set(list.map((f) => f.verb.binyan)).size === 1;
}
/** هل الصيغة تدل على جذر واحد فقط؟ */
function uniqueRoot(form: string): boolean {
  const list = byForm.get(form) ?? [];
  return new Set(list.map((f) => f.verb.root)).size === 1;
}
/** هل الصيغة تدل على زمن واحد فقط؟ (נכתב ماضٍ وحاضر معًا ← لا) */
function uniqueTense(form: string): boolean {
  const list = byForm.get(form) ?? [];
  return new Set(list.map((f) => f.tense)).size === 1;
}

const HARD_BINYANIM: Binyan[] = ["pual", "hufal", "nifal", "hitpael"];

function binyanDifficulty(b: Binyan): Difficulty {
  if (b === "paal" || b === "piel") return "easy";
  if (b === "hifil" || b === "hitpael") return "medium";
  return "hard";
}

function mcqOptions(correct: string, pool: string[], seed: string, count = 4): string[] {
  const distractors: string[] = [];
  for (const p of pool) {
    if (p !== correct && !distractors.includes(p)) distractors.push(p);
    if (distractors.length >= count - 1) break;
  }
  return seededShuffle([correct, ...distractors], seed);
}

const binyanOptionPool = (b: Binyan) => [
  ...confusablesOf(b).map((x) => BINYAN_LABEL[x]),
  ...BINYAN_ORDER.filter((x) => x !== b).map((x) => BINYAN_LABEL[x]),
];

const rootNoDots = (root: string) => root.replace(/\./g, "");

/** كل صور كتابة الجذر المقبولة: بالنقاط، بالشرطات، بالمسافات، أو ملتصقة. */
function acceptedRoots(root: string, extra: string[] = []): string[] {
  const forms = (r: string) => {
    const letters = r.split(".");
    return [rootNoDots(r), letters.join("-"), letters.join(" "), r];
  };
  return [...forms(root), ...extra.flatMap(forms)];
}

const BINYAN_ACCEPTED: Record<Binyan, string[]> = {
  paal: ["פעל", "קל", "paal", "pa'al", "بعل", "פָּעַל"],
  nifal: ["נפעל", "nifal", "nif'al", "نفعل"],
  piel: ["פיעל", "פעל כבד", "piel", "pi'el", "فيعل", "بيعل"],
  pual: ["פועל", "pual", "pu'al", "فوعل", "بوعل"],
  hifil: ["הפעיל", "hifil", "hif'il", "هفعيل"],
  hufal: ["הופעל", "hufal", "huf'al", "هوفعل"],
  hitpael: ["התפעל", "hitpael", "hitpa'el", "هتفعل"],
};

const TENSE_ACCEPTED: Record<Tense, string[]> = {
  past: ["עבר", "past", "ماضي", "ماض", "الماضي"],
  present: ["הווה", "present", "حاضر", "مضارع", "الحاضر"],
  future: ["עתיד", "future", "مستقبل", "المستقبل"],
  imperative: ["ציווי", "imperative", "امر", "الامر"],
  infinitive: ["שם הפועל", "infinitive", "مصدر", "المصدر"],
};

const TENSE_PLAIN: Record<Tense, string> = {
  past: "עבר",
  present: "הווה",
  future: "עתיד",
  imperative: "ציווי",
  infinitive: "שם הפועל",
};

const TENSE_AR: Record<Tense, string> = {
  past: "الماضي",
  present: "الحاضر",
  future: "المستقبل",
  imperative: "الأمر",
  infinitive: "المصدر",
};

const lessonOf = (b: Binyan) => `binyan-${b}`;

// ============================================================
// 1) تحديد البنيان من صيغة معطاة
// ============================================================
function genBinyanMcq(): Question[] {
  const out: Question[] = [];
  for (const ref of ALL_FORMS) {
    if (ref.key === "imperative") continue;
    if (!uniqueBinyan(ref.form)) continue;
    // الماضي لكل الأفعال، والحاضر للأوزان التي يكثر الخلط فيها فقط
    if (ref.key === "future3ms") continue;
    if (ref.key === "present3ms" && !HARD_BINYANIM.includes(ref.verb.binyan)) continue;
    const v = ref.verb;
    const id = `g-bin-${rootNoDots(v.root)}-${v.binyan}-${ref.key}`;
    const correct = BINYAN_LABEL[v.binyan];
    out.push({
      id,
      type: "mcq",
      topic: "binyanim",
      subtopics: ["binyanim"],
      difficulty: binyanDifficulty(v.binyan),
      prompt: `ما هو بنيان (בניין) الفعل التالي؟`,
      hebrew: ref.form,
      options: mcqOptions(correct, binyanOptionPool(v.binyan), id),
      answer: correct,
      explanation: `«${ref.form}» من الجذر ${v.root} في وزن ${correct} (${TENSE_AR[ref.tense]})، ومعناه: ${v.meaningAr}. قياس الوزن: ${v.binyan === "paal" ? "ثلاثة أحرف بلا بادئة في الماضي" : ""}${v.binyan === "nifal" ? "بادئة נ في الماضي والحاضر" : ""}${v.binyan === "piel" ? "حاضر بـ מ وماضٍ بلا بادئة" : ""}${v.binyan === "pual" ? "واو ثابتة بعد الحرف الأول من الجذر" : ""}${v.binyan === "hifil" ? "بادئة ה مع ياء قبل الحرف الأخير" : ""}${v.binyan === "hufal" ? "بادئة הו في الماضي و מו في الحاضر" : ""}${v.binyan === "hitpael" ? "بادئة הת في الماضي و מת في الحاضر" : ""}.`,
      hint: `انظر إلى البادئة وموضع الواو أو الياء، ولا تحكم من الحرف الأول وحده.`,
      ruleId: `rule-identify-${v.binyan}`,
      lessonSlug: lessonOf(v.binyan),
      binyan: v.binyan,
      tense: ref.tense,
      root: v.root,
      tags: ["generated"],
    });
  }
  return out;
}

// ============================================================
// 2) تحديد الجذر (كتابة)
// ============================================================
function genRootWrite(): Question[] {
  const out: Question[] = [];
  ALL_FORMS.forEach((ref, i) => {
    if (ref.key === "imperative") return;
    if (!uniqueRoot(ref.form)) return;
    if (i % 3 !== 0) return;
    const v = ref.verb;
    const id = `g-root-${rootNoDots(v.root)}-${v.binyan}-${ref.key}`;
    out.push({
      id,
      type: "write-root",
      topic: "root",
      subtopics: ["root"],
      difficulty: v.gizra === "shlemim" ? "easy" : "hard",
      prompt: `اكتب جذر (שורש) الفعل التالي. اكتب الأحرف فقط، مثل: כ.ת.ב`,
      hebrew: ref.form,
      answer: v.root,
      acceptedAnswers: acceptedRoots(v.root, v.rootAccept ?? []),
      explanation: `جذر «${ref.form}» هو ${v.root}. أحرف الوزن (${v.binyan === "hitpael" ? "הת / מת / ית" : v.binyan === "hufal" ? "הו / מו / יו" : v.binyan === "nifal" ? "נ / ייـ" : v.binyan === "hifil" ? "ה / מ / י مع الياء" : "البادئة والحركات"}) لا تُحسب من الجذر.${v.notes ? " ملاحظة: " + v.notes : ""}`,
      hint: `احذف أحرف الوزن والبادئة، وما يبقى هو الجذر.`,
      ruleId: "rule-root-extraction",
      lessonSlug: "roots-and-conjugation",
      binyan: v.binyan,
      tense: ref.tense,
      root: v.root,
      tags: ["generated"],
    });
  });
  return out;
}

// ============================================================
// 3) تحديد الزمن
// ============================================================
function genTenseQuestions(): Question[] {
  const out: Question[] = [];
  ALL_FORMS.forEach((ref, i) => {
    if (!uniqueTense(ref.form)) return; // مثل «נכתב» ماضٍ وحاضر ← مستثنى
    if (i % 2 !== 0) return;
    const v = ref.verb;
    const id = `g-tense-${rootNoDots(v.root)}-${v.binyan}-${ref.key}`;
    const correct = TENSE_PLAIN[ref.tense];
    const pool = (["past", "present", "future", "imperative"] as Tense[])
      .filter((t) => t !== ref.tense)
      .map((t) => TENSE_PLAIN[t]);
    out.push({
      id,
      type: "mcq",
      topic: "tense",
      subtopics: ["tense", "binyanim"],
      difficulty: ref.tense === "future" || ref.tense === "past" ? "easy" : "medium",
      prompt: `في أي زمن (זמן) يأتي الفعل التالي؟`,
      hebrew: ref.form,
      options: mcqOptions(correct, pool, id),
      answer: correct,
      explanation: `«${ref.form}» في ${correct} — ${TENSE_AR[ref.tense]} من وزن ${BINYAN_LABEL[v.binyan]} (الجذر ${v.root}).`,
      hint: `بادئات المستقبل: י/ת/א/נ. بادئة الحاضر في معظم الأوزان: מ. الماضي غالبًا بلا بادئة زمنية.`,
      ruleId: "rule-tense-signs",
      lessonSlug: "roots-and-conjugation",
      binyan: v.binyan,
      tense: ref.tense,
      root: v.root,
      tags: ["generated"],
    });
  });
  return out;
}

// ============================================================
// 4) פעיל / סביל / חוזר
// ============================================================
function genVoiceQuestions(): Question[] {
  const out: Question[] = [];
  ALL_FORMS.forEach((ref) => {
    if (ref.key !== "past3ms") return;
    if (!uniqueBinyan(ref.form)) return;
    const v = ref.verb;
    const id = `g-voice-${rootNoDots(v.root)}-${v.binyan}`;
    const correct = VOICE_LABEL[v.voice];
    const options = [VOICE_LABEL.active, VOICE_LABEL.passive, VOICE_LABEL.middle];
    const why =
      v.voice === "passive"
        ? `وزن ${BINYAN_LABEL[v.binyan]} هو المجهول المقابل لوزن ${BINYAN_LABEL[v.binyan === "nifal" ? "paal" : v.binyan === "pual" ? "piel" : "hifil"]}، والفاعل الحقيقي محجوب${v.activeCounterpart ? ` (المعلوم المقابل: «${v.activeCounterpart}»)` : ""}.`
        : v.voice === "middle"
          ? `هنا الفاعل يقوم بالفعل فعلًا، فليس مبنيًا للمجهول رغم أن وزنه ${BINYAN_LABEL[v.binyan]}. ${v.notes ?? ""}`
          : `الفاعل معلوم ويؤدي الفعل، فالوزن ${BINYAN_LABEL[v.binyan]} مبني للمعلوم.`;
    out.push({
      id,
      type: "voice-pick",
      topic: "voice",
      subtopics: ["voice", "binyanim"],
      difficulty: v.voice === "middle" ? "hard" : v.voice === "passive" ? "medium" : "easy",
      prompt: `هل الفعل التالي פעיל (معلوم) أم סביל (مجهول) أم חוזר/הדדי/עומד (انعكاسي أو متبادل أو لازم، فلا معلوم ولا مجهول)؟`,
      hebrew: ref.form,
      options,
      answer: correct,
      explanation: `«${ref.form}» (${v.meaningAr}) — ${correct}. ${why}`,
      hint: `اسأل: هل هناك فاعل حقيقي يؤدي الفعل؟ وهل يمكن إضافة «על ידי...»؟`,
      ruleId: "rule-active-passive",
      lessonSlug: "active-passive",
      binyan: v.binyan,
      root: v.root,
      tags: ["generated"],
    });
  });
  return out;
}

// ============================================================
// 5) تحويل معلوم ⇄ مجهول (كتابة)
// ============================================================
function genTransformQuestions(): Question[] {
  const out: Question[] = [];
  const passives = VERB_DATA.filter((v) => v.voice === "passive" && v.activeCounterpart);
  for (const p of passives) {
    const active = VERB_DATA.find((v) => v.past3ms === p.activeCounterpart);
    if (!active) continue;
    const idA = `g-trans-act2pas-${rootNoDots(p.root)}-${p.binyan}`;
    out.push({
      id: idA,
      type: "transform",
      topic: "pairs",
      subtopics: ["pairs", "voice", "conjugation"],
      difficulty: "hard",
      prompt: `الفعل التالي مبني للمعلوم في وزن ${BINYAN_LABEL[active.binyan]}. اكتب الفعل المبني للمجهول المقابل له في نفس الزمن (${TENSE_AR.past}).`,
      hebrew: active.past3ms,
      answer: p.past3ms,
      acceptedAnswers: [p.past3ms],
      explanation: `«${active.past3ms}» (${BINYAN_LABEL[active.binyan]}) ← مجهوله «${p.past3ms}» (${BINYAN_LABEL[p.binyan]}). ${BINYAN_LABEL[active.binyan]} ← ${BINYAN_LABEL[p.binyan]} زوج ثابت للمعلوم والمجهول.`,
      hint: `${BINYAN_LABEL[active.binyan]} مجهوله ${BINYAN_LABEL[p.binyan]}. ابقِ الجذر واستبدل أحرف الوزن.`,
      ruleId: "rule-voice-pairs",
      lessonSlug: "active-passive",
      binyan: p.binyan,
      root: p.root,
      tags: ["generated"],
    });
    const idB = `g-trans-pas2act-${rootNoDots(p.root)}-${p.binyan}`;
    out.push({
      id: idB,
      type: "transform",
      topic: "pairs",
      subtopics: ["pairs", "voice", "conjugation"],
      difficulty: "hard",
      prompt: `الفعل التالي مبني للمجهول في وزن ${BINYAN_LABEL[p.binyan]}. اكتب الفعل المبني للمعلوم المقابل له في نفس الزمن (${TENSE_AR.past}).`,
      hebrew: p.past3ms,
      answer: active.past3ms,
      acceptedAnswers: [active.past3ms],
      explanation: `«${p.past3ms}» (${BINYAN_LABEL[p.binyan]}) معلومه «${active.past3ms}» (${BINYAN_LABEL[active.binyan]}) من نفس الجذر ${p.root}.`,
      hint: `${BINYAN_LABEL[p.binyan]} معلومه ${BINYAN_LABEL[active.binyan]}.`,
      ruleId: "rule-voice-pairs",
      lessonSlug: "active-passive",
      binyan: active.binyan,
      root: p.root,
      tags: ["generated"],
    });
  }
  return out;
}

// ============================================================
// 6) أزواج الأوزان: اختيار الصيغة المناسبة للمعنى
// ============================================================
function genMeaningMcq(): Question[] {
  const out: Question[] = [];
  const byRoot = new Map<string, VerbEntry[]>();
  for (const v of VERB_DATA) {
    const list = byRoot.get(v.root) ?? [];
    list.push(v);
    byRoot.set(v.root, list);
  }
  for (const [root, list] of byRoot) {
    if (list.length < 3) continue;
    for (const v of list) {
      const id = `g-mean-${rootNoDots(root)}-${v.binyan}`;
      const pool = list.filter((x) => x.binyan !== v.binyan).map((x) => x.past3ms);
      if (pool.length < 2) continue;
      out.push({
        id,
        type: "mcq",
        topic: "pairs",
        subtopics: ["pairs", "binyanim", "voice"],
        difficulty: "expert",
        prompt: `كل الخيارات من الجذر ${root}. أي فعل منها يعني: «${v.meaningAr}»؟`,
        options: mcqOptions(v.past3ms, pool, id),
        answer: v.past3ms,
        explanation: `«${v.past3ms}» في وزن ${BINYAN_LABEL[v.binyan]} ومعناه ${v.meaningAr}. باقي الخيارات من نفس الجذر لكن بأوزان أخرى، ولكل وزن معنى مختلف: ${list
          .filter((x) => x.binyan !== v.binyan)
          .map((x) => `«${x.past3ms}» (${BINYAN_LABEL[x.binyan]}) = ${x.meaningAr}`)
          .join("، ")}.`,
        hint: `الجذر واحد والمعنى يتغير بتغير الوزن. ابحث عن الوزن الذي يحمل هذا المعنى.`,
        ruleId: "rule-root-plus-binyan-meaning",
        lessonSlug: "roots-and-conjugation",
        binyan: v.binyan,
        root,
        tags: ["generated"],
      });
    }
  }
  return out;
}

// ============================================================
// 7) صح / خطأ عن أزواج المجهول والأوزان
// ============================================================
function genTrueFalse(): Question[] {
  const out: Question[] = [];
  const passives = VERB_DATA.filter((v) => v.voice === "passive" && v.activeCounterpart);
  passives.forEach((p, i) => {
    const active = VERB_DATA.find((v) => v.past3ms === p.activeCounterpart);
    if (!active) return;
    const makeTrue = i % 2 === 0;
    const wrongBinyan = confusablesOf(p.binyan)[0] ?? "piel";
    const claimedBinyan = makeTrue ? p.binyan : (wrongBinyan as Binyan);
    const id = `g-tf-${rootNoDots(p.root)}-${p.binyan}-${makeTrue ? "t" : "f"}`;
    out.push({
      id,
      type: "true-false",
      topic: "voice",
      subtopics: ["voice", "pairs", "binyanim"],
      difficulty: "medium",
      prompt: `هل العبارة التالية صحيحة؟ «${p.past3ms}» هو المبني للمجهول من «${active.past3ms}»، وهو في وزن ${BINYAN_LABEL[claimedBinyan]}.`,
      hebrew: `${active.past3ms} ← ${p.past3ms}`,
      options: ["صحيح", "خطأ"],
      answer: makeTrue ? "صحيح" : "خطأ",
      explanation: makeTrue
        ? `صحيح: «${p.past3ms}» في وزن ${BINYAN_LABEL[p.binyan]} وهو مجهول «${active.past3ms}» (${BINYAN_LABEL[active.binyan]}).`
        : `خطأ في جزء الوزن: «${p.past3ms}» فعلًا مجهول «${active.past3ms}»، لكن وزنه ${BINYAN_LABEL[p.binyan]} وليس ${BINYAN_LABEL[claimedBinyan]}.`,
      hint: `اجزم أولًا بعلاقة المعلوم والمجهول، ثم تحقق من اسم الوزن بدقة.`,
      ruleId: "rule-voice-pairs",
      lessonSlug: "active-passive",
      binyan: p.binyan,
      root: p.root,
      tags: ["generated"],
    });
  });

  // صح/خطأ عن نפעل و התפעל: هل هما مجهول دائمًا؟
  VERB_DATA.filter((v) => v.voice === "middle").forEach((v, i) => {
    const id = `g-tf-mid-${rootNoDots(v.root)}-${v.binyan}`;
    const claimPassive = i % 2 === 0;
    out.push({
      id,
      type: "true-false",
      topic: "voice",
      subtopics: ["voice", "binyanim"],
      difficulty: "hard",
      prompt: claimPassive
        ? `هل العبارة التالية صحيحة؟ الفعل «${v.past3ms}» مبني للمجهول (סביל) لأن وزنه ${BINYAN_LABEL[v.binyan]}.`
        : `هل العبارة التالية صحيحة؟ الفعل «${v.past3ms}» ليس مبنيًا للمجهول رغم أن وزنه ${BINYAN_LABEL[v.binyan]}.`,
      hebrew: v.past3ms,
      options: ["صحيح", "خطأ"],
      answer: claimPassive ? "خطأ" : "صحيح",
      explanation: `«${v.past3ms}» معناه ${v.meaningAr}، وله فاعل حقيقي يؤدي الفعل، فهو ليس مجهولًا. ${BINYAN_LABEL[v.binyan]} وزن قد يكون مجهولًا وقد لا يكون، والمعنى هو الفاصل. ${v.notes ?? ""}`,
      hint: `اختبر بإضافة «על ידי מישהו»: إن لم تصح الإضافة فالفعل ليس مجهولًا.`,
      ruleId: "rule-nifal-hitpael-not-always-passive",
      lessonSlug: "active-passive",
      binyan: v.binyan,
      root: v.root,
      tags: ["generated"],
    });
  });
  return out;
}

// ============================================================
// 8) التمييز بين وزنين متشابهين لنفس الجذر
// ============================================================
function genDistinguish(): Question[] {
  const out: Question[] = [];
  const pairsWanted: [Binyan, Binyan][] = [
    ["hifil", "hufal"],
    ["piel", "pual"],
    ["paal", "nifal"],
    ["hitpael", "hufal"],
    ["piel", "hitpael"],
    ["paal", "piel"],
  ];
  const byRoot = new Map<string, VerbEntry[]>();
  for (const v of VERB_DATA) {
    const list = byRoot.get(v.root) ?? [];
    list.push(v);
    byRoot.set(v.root, list);
  }
  for (const [root, list] of byRoot) {
    for (const [a, b] of pairsWanted) {
      const va = list.find((v) => v.binyan === a);
      const vb = list.find((v) => v.binyan === b);
      if (!va || !vb) continue;
      const id = `g-dist-${rootNoDots(root)}-${a}-${b}`;
      out.push({
        id,
        type: "distinguish",
        topic: "pairs",
        subtopics: ["pairs", "binyanim", "voice"],
        difficulty: "expert",
        prompt: `الفعلان «${va.past3ms}» و«${vb.past3ms}» من الجذر ${root}. أي الجملتين تصف الفرق بينهما وصفًا صحيحًا؟`,
        hebrew: `${va.past3ms} / ${vb.past3ms}`,
        options: mcqOptions(
          `«${va.past3ms}» = ${BINYAN_LABEL[a]} (${va.meaningAr})، و«${vb.past3ms}» = ${BINYAN_LABEL[b]} (${vb.meaningAr})`,
          [
            `«${va.past3ms}» = ${BINYAN_LABEL[b]} (${vb.meaningAr})، و«${vb.past3ms}» = ${BINYAN_LABEL[a]} (${va.meaningAr})`,
            `الفعلان في نفس الوزن ${BINYAN_LABEL[a]}، والفرق في الزمن فقط`,
            `الفعلان في نفس الوزن ${BINYAN_LABEL[b]}، والفرق في الشخص فقط`,
          ],
          id,
        ),
        answer: `«${va.past3ms}» = ${BINYAN_LABEL[a]} (${va.meaningAr})، و«${vb.past3ms}» = ${BINYAN_LABEL[b]} (${vb.meaningAr})`,
        explanation: `الجذر واحد (${root}) لكن الوزن مختلف: «${va.past3ms}» في ${BINYAN_LABEL[a]} ومعناه ${va.meaningAr}، و«${vb.past3ms}» في ${BINYAN_LABEL[b]} ومعناه ${vb.meaningAr}. العلامة المميزة: ${a === "hifil" ? "ה مع ياء" : a === "paal" ? "ثلاثة أحرف بلا بادئة" : a === "piel" ? "حاضر بـ מ بلا واو" : "بادئة الوزن"} مقابل ${b === "hufal" ? "הו/מו" : b === "pual" ? "واو بعد الحرف الأول" : b === "nifal" ? "נ" : b === "hitpael" ? "הת/מת" : "بادئة الوزن"}.`,
        hint: `قارن البادئة وحرف الواو أو الياء، وقارن المعنى: من يفعل ومن يقع عليه الفعل.`,
        ruleId: `rule-confusion-${a}-${b}`,
        lessonSlug: "exam-skills",
        binyan: a,
        root,
        tags: ["generated"],
      });
    }
  }
  return out;
}

// ============================================================
// 9) التصريف: اكتب صيغة الزمن المطلوب
// ============================================================
function genConjugationWrite(): Question[] {
  const out: Question[] = [];
  VERB_DATA.forEach((v, i) => {
    const targets: [FormKey, Tense][] = [
      ["future3ms", "future"],
      ["present3ms", "present"],
    ];
    const pick = targets[i % targets.length];
    const [key, tense] = pick;
    const target = v[key];
    if (!target) return;
    const id = `g-conj-${rootNoDots(v.root)}-${v.binyan}-${key}`;
    out.push({
      id,
      type: "open-write",
      topic: "conjugation",
      subtopics: ["conjugation", "tense", "binyanim"],
      difficulty: v.gizra === "shlemim" ? "medium" : "hard",
      prompt: `الفعل التالي في ${TENSE_AR.past} (הוא) ووزنه ${BINYAN_LABEL[v.binyan]}. اكتبه في ${TENSE_AR[tense]} لنفس الشخص (הוא).`,
      hebrew: v.past3ms,
      answer: target,
      acceptedAnswers: [target],
      explanation: `«${v.past3ms}» ← ${TENSE_AR[tense]}: «${target}». في وزن ${BINYAN_LABEL[v.binyan]} تكون ${tense === "future" ? "بادئة المستقبل للغائب" : "صيغة الحاضر"} ${tense === "future" ? (v.binyan === "nifal" ? "ייـ" : v.binyan === "hufal" ? "יו" : v.binyan === "hitpael" ? "ית" : "יـ") : v.binyan === "paal" ? "على وزن كּוֹתֵב" : v.binyan === "nifal" ? "بـ נ" : v.binyan === "hufal" ? "بـ מו" : v.binyan === "pual" ? "بـ מ مع واو" : v.binyan === "hitpael" ? "بـ מת" : "بـ מ"}.`,
      hint: `أبقِ الجذر ${v.root} كما هو، وغيّر أحرف الوزن والزمن فقط.`,
      ruleId: `rule-conjugate-${v.binyan}`,
      lessonSlug: lessonOf(v.binyan),
      binyan: v.binyan,
      tense,
      root: v.root,
      tags: ["generated"],
    });
  });
  return out;
}

// ============================================================
// 10) مطابقة أفعال مع أوزانها (عدة حقول في سؤال واحد)
// ============================================================
function genMatch(): Question[] {
  const out: Question[] = [];
  const groups: Binyan[][] = [
    ["paal", "nifal", "piel", "pual"],
    ["hifil", "hufal", "hitpael", "nifal"],
    ["piel", "pual", "hifil", "hufal"],
    ["paal", "piel", "hifil", "hitpael"],
    ["nifal", "pual", "hufal", "hitpael"],
    ["paal", "hifil", "hufal", "pual"],
    ["piel", "hitpael", "nifal", "hifil"],
    ["pual", "paal", "hitpael", "hufal"],
  ];
  groups.forEach((group, gi) => {
    const fields = group
      .map((b, idx) => {
        const candidates = VERB_DATA.filter((v) => v.binyan === b && uniqueBinyan(v.past3ms));
        const v = candidates[(gi * 3 + idx) % candidates.length];
        if (!v) return null;
        return {
          key: v.past3ms,
          label: v.past3ms,
          options: BINYAN_ORDER.map((x) => BINYAN_LABEL[x]),
          answer: BINYAN_LABEL[b],
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);
    if (fields.length < 4) return;
    const id = `g-match-${gi}`;
    out.push({
      id,
      type: "match",
      topic: "binyanim",
      subtopics: ["binyanim"],
      difficulty: "medium",
      prompt: `طابق كل فعل مع بنيانه الصحيح.`,
      fields,
      explanation: fields.map((f) => `«${f.label}» ← ${f.answer}`).join("، ") + ".",
      hint: `ابدأ بالأوزان التي لها علامة واضحة (הو، מו، הת، מת)، ثم استبعد الباقي.`,
      ruleId: "rule-identify-all",
      lessonSlug: "binyanim-overview",
      tags: ["generated"],
    });
  });
  return out;
}

// ============================================================
// 11) سؤال مركّب: جذر + بنيان + زمن + معلوم/مجهول
// ============================================================
function genMultiSkill(): Question[] {
  const out: Question[] = [];
  VERB_DATA.forEach((v, i) => {
    if (i % 3 !== 0) return;
    if (!uniqueBinyan(v.past3ms) || !uniqueRoot(v.past3ms)) return;
    const id = `g-multi-${rootNoDots(v.root)}-${v.binyan}`;
    out.push({
      id,
      type: "multi-skill",
      topic: "sentence-analysis",
      subtopics: ["root", "binyanim", "tense", "voice"],
      difficulty: "expert",
      prompt: `حلّل الفعل «${v.past3ms}» تحليلًا كاملًا: الجذر، البنيان، الزمن، ومعلوم أو مجهول.`,
      hebrew: v.past3ms,
      fields: [
        {
          key: "root",
          label: "الجذر (שורש)",
          options: seededShuffle(
            [v.root, ...VERB_DATA.filter((x) => x.root !== v.root).slice(0, 3).map((x) => x.root)],
            id + "-root",
          ),
          answer: v.root,
        },
        {
          key: "binyan",
          label: "البنيان (בניין)",
          options: BINYAN_ORDER.map((b) => BINYAN_LABEL[b]),
          answer: BINYAN_LABEL[v.binyan],
        },
        {
          key: "tense",
          label: "الزمن (זמן)",
          options: ["עבר", "הווה", "עתיד", "ציווי"],
          answer: "עבר",
        },
        {
          key: "voice",
          label: "פעיל / סביל",
          options: [VOICE_LABEL.active, VOICE_LABEL.passive, VOICE_LABEL.middle],
          answer: VOICE_LABEL[v.voice],
        },
      ],
      explanation: `«${v.past3ms}»: الجذر ${v.root}، الوزن ${BINYAN_LABEL[v.binyan]}، الزمن עבר (الغائب הוא)، و${VOICE_LABEL[v.voice]}. المعنى: ${v.meaningAr}.`,
      hint: `ابدأ بحذف أحرف الوزن لاستخراج الجذر، ثم حدد الوزن من البادئة، ثم المعنى يحدد معلوم أو مجهول.`,
      ruleId: "rule-full-analysis",
      lessonSlug: "exam-skills",
      binyan: v.binyan,
      tense: "past",
      root: v.root,
      tags: ["generated"],
    });
  });
  return out;
}

// ============================================================
// 12) كتابة اسم البنيان وكتابة الزمن (أسئلة بلا خيارات)
// ============================================================
function genBinyanWrite(): Question[] {
  const out: Question[] = [];
  ALL_FORMS.forEach((ref, i) => {
    if (ref.key === "imperative") return;
    if (!uniqueBinyan(ref.form)) return;
    if (i % 4 !== 1) return;
    const v = ref.verb;
    const id = `g-wbin-${rootNoDots(v.root)}-${v.binyan}-${ref.key}`;
    out.push({
      id,
      type: "write-binyan",
      topic: "binyanim",
      subtopics: ["binyanim"],
      difficulty: HARD_BINYANIM.includes(v.binyan) ? "hard" : "medium",
      prompt: `اكتب اسم بنيان الفعل التالي بالعبرية (مثال: פיעל):`,
      hebrew: ref.form,
      answer: BINYAN_LABEL[v.binyan],
      acceptedAnswers: BINYAN_ACCEPTED[v.binyan],
      explanation: `«${ref.form}» من الجذر ${v.root} في وزن ${BINYAN_LABEL[v.binyan]}، ومعناه ${v.meaningAr}.`,
      hint: `افحص البادئة وموضع الواو والياء، ثم تأكد أن بقية الأحرف تعطي جذرًا ذا معنى.`,
      ruleId: `rule-identify-${v.binyan}`,
      lessonSlug: lessonOf(v.binyan),
      binyan: v.binyan,
      tense: ref.tense,
      root: v.root,
      tags: ["generated"],
    });
  });
  return out;
}

function genTenseWrite(): Question[] {
  const out: Question[] = [];
  ALL_FORMS.forEach((ref, i) => {
    if (!uniqueTense(ref.form)) return;
    if (i % 5 !== 2) return;
    const v = ref.verb;
    const id = `g-wtense-${rootNoDots(v.root)}-${v.binyan}-${ref.key}`;
    out.push({
      id,
      type: "write-tense",
      topic: "tense",
      subtopics: ["tense"],
      difficulty: "medium",
      prompt: `اكتب زمن الفعل التالي بالعبرية (עבר / הווה / עתיד / ציווי):`,
      hebrew: ref.form,
      answer: TENSE_PLAIN[ref.tense],
      acceptedAnswers: TENSE_ACCEPTED[ref.tense],
      explanation: `«${ref.form}» في ${TENSE_PLAIN[ref.tense]} (${TENSE_AR[ref.tense]})، وزنه ${BINYAN_LABEL[v.binyan]} من الجذر ${v.root}.`,
      hint: `بادئات المستقبل: א/ת/י/נ. بادئة الحاضر في معظم الأوزان: מ.`,
      ruleId: "rule-tense-signs",
      lessonSlug: "roots-and-conjugation",
      binyan: v.binyan,
      tense: ref.tense,
      root: v.root,
      tags: ["generated"],
    });
  });
  return out;
}

// ============================================================
// 13) تصحيح الأخطاء: فعل معلوم في سياق مجهول والعكس
// ============================================================
function genErrorCorrection(): Question[] {
  const out: Question[] = [];
  const passives = VERB_DATA.filter((v) => v.voice === "passive" && v.activeCounterpart);
  passives.forEach((p, i) => {
    const active = VERB_DATA.find((v) => v.past3ms === p.activeCounterpart);
    if (!active) return;
    if (i % 2 === 0) {
      const id = `g-fix-a2p-${rootNoDots(p.root)}-${p.binyan}`;
      out.push({
        id,
        type: "fix-error",
        topic: "error-correction",
        subtopics: ["error-correction", "voice", "pairs"],
        difficulty: "hard",
        prompt: `في جملة مبنية للمجهول تحتوي «על ידי», استُعمل الفعل المعلوم التالي خطأً. اكتب الفعل الصحيح في نفس الزمن (עבר):`,
        hebrew: active.past3ms,
        answer: p.past3ms,
        acceptedAnswers: [p.past3ms],
        explanation: `وجود «על ידי» يفرض المجهول، فلا يصح «${active.past3ms}» (${BINYAN_LABEL[active.binyan]}). الصواب «${p.past3ms}» في وزن ${BINYAN_LABEL[p.binyan]}، وهو المجهول المقابل.`,
        hint: `${BINYAN_LABEL[active.binyan]} مجهوله ${BINYAN_LABEL[p.binyan]}؛ أبقِ الجذر ${p.root} وغيّر أحرف الوزن.`,
        ruleId: "rule-passive-by-agent",
        lessonSlug: "active-passive",
        binyan: p.binyan,
        root: p.root,
        tags: ["generated"],
      });
    } else {
      const id = `g-fix-p2a-${rootNoDots(p.root)}-${p.binyan}`;
      out.push({
        id,
        type: "fix-error",
        topic: "error-correction",
        subtopics: ["error-correction", "voice", "pairs"],
        difficulty: "hard",
        prompt: `في جملة فاعلها معلوم ومفعولها مسبوق بـ «את», استُعمل الفعل المجهول التالي خطأً. اكتب الفعل الصحيح في نفس الزمن (עבר):`,
        hebrew: p.past3ms,
        answer: active.past3ms,
        acceptedAnswers: [active.past3ms],
        explanation: `الفعل المجهول «${p.past3ms}» (${BINYAN_LABEL[p.binyan]}) لا يقبل مفعولًا به بـ «את»، لأن المفعول صار فاعلًا نحويًا. الصواب الفعل المعلوم «${active.past3ms}» في وزن ${BINYAN_LABEL[active.binyan]}.`,
        hint: `علامة «את» تعني فعلًا متعديًا مبنيًا للمعلوم.`,
        ruleId: "rule-et-marks-object",
        lessonSlug: "active-passive",
        binyan: active.binyan,
        root: p.root,
        tags: ["generated"],
      });
    }
  });
  return out;
}

export function generateQuestions(): Question[] {
  return [
    ...genBinyanMcq(),
    ...genRootWrite(),
    ...genTenseQuestions(),
    ...genVoiceQuestions(),
    ...genTransformQuestions(),
    ...genMeaningMcq(),
    ...genTrueFalse(),
    ...genDistinguish(),
    ...genConjugationWrite(),
    ...genMatch(),
    ...genMultiSkill(),
    ...genBinyanWrite(),
    ...genTenseWrite(),
    ...genErrorCorrection(),
  ];
}
