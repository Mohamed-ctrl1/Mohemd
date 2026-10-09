import { ALL_TOPICS, QUESTION_BANK, TOPIC_SHORT } from "@/data/questionBank";
import { BINYAN_LABEL } from "@/data/binyanim";
import type { AnswerRecord, AppData } from "./storage";
import type { Topic } from "./types";

export interface TopicStat {
  topic: Topic;
  label: string;
  attempted: number;        // عدد الأسئلة التي حلّها الطالب في هذا الموضوع
  correct: number;
  rate: number;             // نسبة الإجابات الصحيحة 0..1
  lastRate: number;         // أداء آخر 10 أسئلة
  trend: number;            // الفرق بين آخر 10 وما قبلها
  confidence: number;       // درجة الثقة في التقييم 0..1
  available: number;        // عدد الأسئلة المتاحة في البنك
  status: "no-data" | "low-data" | "strong" | "ok" | "weak";
  priority: number;         // أولوية المراجعة
}

const MIN_FOR_JUDGEMENT = 6;   // أقل عدد إجابات للحكم على الموضوع
const CONFIDENCE_FULL = 14;    // العدد الذي تصل عنده الثقة إلى 100%

function rateOf(list: AnswerRecord[]): number {
  if (!list.length) return 0;
  const earned = list.reduce((s, a) => s + a.earned, 0);
  const total = list.reduce((s, a) => s + a.total, 0);
  return total ? earned / total : 0;
}

/** كل سؤال يُحسب في موضوعه الأساسي وفي مواضيعه الفرعية أيضًا. */
function answersOfTopic(answers: AnswerRecord[], topic: Topic): AnswerRecord[] {
  return answers.filter((a) => a.topic === topic || (a.subtopics ?? []).includes(topic));
}

export function topicStats(data: AppData): TopicStat[] {
  const availableByTopic = new Map<Topic, number>();
  for (const t of ALL_TOPICS) {
    availableByTopic.set(
      t,
      QUESTION_BANK.filter((q) => q.topic === t || q.subtopics.includes(t)).length,
    );
  }

  return ALL_TOPICS.map((topic) => {
    const list = answersOfTopic(data.answers, topic).sort((a, b) => a.at - b.at);
    const attempted = list.length;
    const correct = list.filter((a) => a.correct).length;
    const rate = rateOf(list);
    const last10 = list.slice(-10);
    const prev10 = list.slice(-20, -10);
    const lastRate = rateOf(last10);
    const trend = prev10.length ? lastRate - rateOf(prev10) : 0;
    const confidence = Math.min(1, attempted / CONFIDENCE_FULL);

    let status: TopicStat["status"];
    if (attempted === 0) status = "no-data";
    else if (attempted < MIN_FOR_JUDGEMENT) status = "low-data";
    else if (rate >= 0.85) status = "strong";
    else if (rate >= 0.7) status = "ok";
    else status = "weak";

    // الأولوية: الضعف × الثقة. نقص البيانات لا يُعدّ ضعفًا، لكنه يرفع الأولوية قليلًا.
    const priority =
      status === "weak"
        ? (1 - rate) * (0.5 + 0.5 * confidence) * 100
        : status === "ok"
          ? (1 - rate) * 0.6 * (0.5 + 0.5 * confidence) * 100
          : status === "low-data"
            ? 25 + (1 - rate) * 10
            : status === "no-data"
              ? 20
              : (1 - rate) * 20;

    return {
      topic,
      label: TOPIC_SHORT[topic],
      attempted,
      correct,
      rate,
      lastRate,
      trend,
      confidence,
      available: availableByTopic.get(topic) ?? 0,
      status,
      priority,
    };
  }).sort((a, b) => b.priority - a.priority);
}

export interface RulePattern {
  ruleId: string;
  wrong: number;
  total: number;
  rate: number;
}

/** أنماط الخطأ على مستوى القاعدة: أدقّ من مستوى الموضوع. */
export function rulePatterns(data: AppData): RulePattern[] {
  const map = new Map<string, { wrong: number; total: number }>();
  for (const a of data.answers) {
    const e = map.get(a.ruleId) ?? { wrong: 0, total: 0 };
    e.total += 1;
    if (!a.correct) e.wrong += 1;
    map.set(a.ruleId, e);
  }
  return [...map.entries()]
    .map(([ruleId, v]) => ({ ruleId, ...v, rate: v.total ? v.wrong / v.total : 0 }))
    .filter((r) => r.total >= 3 && r.rate >= 0.4)
    .sort((a, b) => b.wrong - a.wrong || b.rate - a.rate);
}

export const RULE_LABEL: Record<string, string> = {
  "rule-voice-pairs": "أزواج المعلوم والمجهول (פיעל/פועל، הפעיל/הופעל)",
  "rule-passive-by-agent": "التعرّف على المجهول من «על ידי»",
  "rule-nifal-hitpael-not-always-passive": "נפעל و־התפעל ليسا مجهولًا دائمًا",
  "rule-prefix-is-not-enough": "عدم الاكتفاء بالحرف الأول لتحديد البنيان",
  "rule-root-extraction": "استخراج الجذر وحذف أحرف الوزن",
  "rule-tense-from-context": "تحديد الزمن من سياق الجملة",
  "rule-nifal-past-present-ambiguity": "التشابه بين ماضي وحاضر נפעל",
  "rule-hitpael-metathesis": "القلب المكاني في התפעל",
  "rule-transitivity": "التعدي واللزوم وأثرهما على المجهول",
  "rule-agreement": "مطابقة الفعل للفاعل في الجنس والعدد",
  "rule-full-analysis": "التحليل الكامل للفعل داخل الجملة",
  "rule-context-decides-binyan": "السياق يحدد البنيان عند تشابه الصيغ",
  "rule-root-plus-binyan-meaning": "تغيّر المعنى بتغيّر الوزن مع ثبات الجذر",
  "rule-impersonal-passive": "المجهول بلا فاعل مذكور",
  "rule-hitpael-vs-hufal": "الفرق بين התפעל و־הופעל",
  "rule-hitpael-reflexive": "المعنى الانعكاسي في התפעל",
  "rule-hitpael-reciprocal": "المعنى المتبادل في התפעל",
  "rule-paal-vs-piel-meaning": "الفرق بين פעל و־פיעל في المعنى",
  "rule-intransitive-paal": "الأفعال اللازمة في פעל",
  "rule-passive-binyanim": "الأوزان المبنية للمجهول",
  "rule-no-imperative-passive": "لا أمر ولا مصدر في פועל و־הופעל",
  "rule-hitpael-no-passive": "התפעל لا مجهول له",
  "rule-hitpael-imperative": "أمر התפעל",
  "rule-et-marks-object": "علامة المفعول به «את»",
  "rule-tense-signs": "علامات الأزمنة",
  "rule-tense-plus-voice": "الجمع بين الزمن والصوت",
  "rule-identify-all": "التعرّف على كل الأوزان",
  "rule-hitpael-vs-hifil": "الفرق بين התפעל و־הפעיל",
  "rule-active-passive": "التمييز بين المبني للمعلوم والمبني للمجهول",
};

/** يحوّل معرّف بنيان إنجليزيًا (hitpael) إلى اسمه العبري (התפעל) للعرض. */
function binyanName(id: string): string {
  return (BINYAN_LABEL as Record<string, string>)[id] ?? id;
}

export function ruleLabel(ruleId: string): string {
  if (RULE_LABEL[ruleId]) return RULE_LABEL[ruleId];
  if (ruleId.startsWith("rule-identify-")) return `التعرّف على وزن ${binyanName(ruleId.replace("rule-identify-", ""))}`;
  if (ruleId.startsWith("rule-conjugate-")) return `تصريف وزن ${binyanName(ruleId.replace("rule-conjugate-", ""))}`;
  if (ruleId.startsWith("rule-confusion-")) {
    const [a, b] = ruleId.replace("rule-confusion-", "").split("-");
    return `التمييز بين ${binyanName(a)} و${binyanName(b)}`;
  }
  return ruleId;
}

export interface Overview {
  lastScore: number | null;
  avgScore: number | null;
  totalAnswered: number;
  correctRate: number;
  examsCount: number;
  openMistakes: number;
  dueReviews: number;
  streakBest: number;
}

export function overview(data: AppData): Overview {
  const exams = [...data.exams].sort((a, b) => a.finishedAt - b.finishedAt);
  const lastScore = exams.length ? exams[exams.length - 1].scorePercent : null;
  const avgScore = exams.length
    ? Math.round(exams.reduce((s, e) => s + e.scorePercent, 0) / exams.length)
    : null;
  const totalEarned = data.answers.reduce((s, a) => s + a.earned, 0);
  const totalUnits = data.answers.reduce((s, a) => s + a.total, 0);
  const mistakes = Object.values(data.mistakes);
  const now = Date.now();
  let best = 0;
  let cur = 0;
  for (const a of [...data.answers].sort((x, y) => x.at - y.at)) {
    if (a.correct) {
      cur += 1;
      best = Math.max(best, cur);
    } else cur = 0;
  }
  return {
    lastScore,
    avgScore,
    totalAnswered: data.answers.length,
    correctRate: totalUnits ? totalEarned / totalUnits : 0,
    examsCount: exams.length,
    openMistakes: mistakes.filter((m) => !m.mastered).length,
    dueReviews: mistakes.filter((m) => !m.mastered && m.nextReviewAt <= now).length,
    streakBest: best,
  };
}

export interface PlanStep {
  title: string;
  detail: string;
  href: string;
  cta: string;
}

/** خطة مراجعة مقترحة تتحدث بعد كل امتحان. */
export function reviewPlan(stat: TopicStat): PlanStep[] {
  const t = stat.topic;
  return [
    {
      title: "1. راجع شرح القاعدة",
      detail: `اقرأ درس «${stat.label}» من جديد وركّز على الأمثلة والأخطاء الشائعة.`,
      href: `/learn?focus=${t}`,
      cta: "فتح الدرس",
    },
    {
      title: "2. حل خمسة أسئلة سهلة",
      detail: "ثبّت القاعدة في أبسط صورة قبل التعقيد.",
      href: `/exam/setup?topics=${t}&count=5&difficulty=easy`,
      cta: "ابدأ 5 أسئلة سهلة",
    },
    {
      title: "3. حل خمسة أسئلة متوسطة",
      detail: "انتقل إلى صيغ أقل وضوحًا وأوزان متشابهة.",
      href: `/exam/setup?topics=${t}&count=5&difficulty=medium`,
      cta: "ابدأ 5 أسئلة متوسطة",
    },
    {
      title: "4. حل أسئلة صعبة",
      detail: "أسئلة داخل جمل كاملة وتمييز بين وزنين متشابهين.",
      href: `/exam/setup?topics=${t}&count=8&difficulty=hard`,
      cta: "ابدأ 8 أسئلة صعبة",
    },
    {
      title: "5. اختبار قصير للتأكد من التحسن",
      detail: "عشرة أسئلة مختلطة في نفس الموضوع بلا تلميحات.",
      href: `/exam/setup?topics=${t}&count=10`,
      cta: "ابدأ الاختبار القصير",
    },
  ];
}
