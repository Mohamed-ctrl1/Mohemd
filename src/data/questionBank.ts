import { generateQuestions } from "./generator";
import { MANUAL_QUESTIONS } from "./questions.manual";
import type { Difficulty, Question, QuestionType, Topic } from "@/lib/types";

/** بنك الأسئلة النهائي: مكتوب يدويًا + مولّد من قاعدة الأفعال، بلا تكرار. */
function build(): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const q of [...MANUAL_QUESTIONS, ...generateQuestions()]) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    out.push(q);
  }
  return out;
}

export const QUESTION_BANK: Question[] = build();

export const QUESTION_BY_ID = new Map(QUESTION_BANK.map((q) => [q.id, q]));

export const TOPIC_LABEL: Record<Topic, string> = {
  binyanim: "הבניינים — الأوزان السبعة",
  root: "שורש — الجذر",
  tense: "זמן — الزمن",
  voice: "פעיל וסביל — معلوم ومجهول",
  conjugation: "נטיית הפועל — التصريف",
  "sentence-analysis": "ניתוח הפועל במשפט — تحليل الفعل في الجملة",
  pairs: "زوجي الأوزان والأوزان المتشابهة",
  "error-correction": "תיקון שגיאות — تصحيح الأخطاء",
};

export const TOPIC_SHORT: Record<Topic, string> = {
  binyanim: "الأوزان",
  root: "الجذر",
  tense: "الزمن",
  voice: "معلوم/مجهول",
  conjugation: "التصريف",
  "sentence-analysis": "تحليل الجملة",
  pairs: "الأوزان المتشابهة",
  "error-correction": "تصحيح الأخطاء",
};

export const ALL_TOPICS: Topic[] = [
  "binyanim",
  "root",
  "tense",
  "voice",
  "conjugation",
  "sentence-analysis",
  "pairs",
  "error-correction",
];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
  expert: "صعب جدًا",
};

export const ALL_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

export const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: "اختيار من متعدد",
  "true-false": "صح أو خطأ",
  "write-binyan": "كتابة البنيان",
  "write-root": "كتابة الجذر",
  "write-tense": "كتابة الزمن",
  "voice-pick": "معلوم / مجهول",
  "fill-blank": "إكمال الجملة",
  transform: "تحويل معلوم ⇄ مجهول",
  "fix-error": "تصحيح خطأ",
  match: "مطابقة",
  analyze: "تحليل في سياق",
  distinguish: "التمييز بين وزنين",
  "open-write": "كتابة حرة",
  "multi-skill": "سؤال مركّب",
};

/** عدد الحقول التي تُصحّح في السؤال (1 لمعظم الأنواع). */
export function questionWeightUnits(q: Question): number {
  return q.fields?.length ?? 1;
}

export function statsByTopic(): Record<Topic, number> {
  const acc = {} as Record<Topic, number>;
  for (const t of ALL_TOPICS) acc[t] = 0;
  for (const q of QUESTION_BANK) acc[q.topic] += 1;
  return acc;
}

export function statsByDifficulty(): Record<Difficulty, number> {
  const acc = {} as Record<Difficulty, number>;
  for (const d of ALL_DIFFICULTIES) acc[d] = 0;
  for (const q of QUESTION_BANK) acc[q.difficulty] += 1;
  return acc;
}

export function statsByType(): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const q of QUESTION_BANK) acc[q.type] = (acc[q.type] ?? 0) + 1;
  return acc;
}
