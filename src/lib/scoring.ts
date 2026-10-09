import { answerMatches } from "./normalize";
import type { Question } from "./types";

export interface Graded {
  earned: number;
  total: number;
  correct: boolean;          // صحيح بالكامل فقط
  perField?: Record<string, boolean>;
}

/**
 * نظام تصحيح واضح وثابت:
 * - سؤال بإجابة واحدة: وحدة واحدة، كلها أو لا شيء. الخطأ = صفر.
 * - سؤال متعدد الحقول: وحدة لكل حقل، ويُحسب «صحيح» فقط إذا صحّت كل الحقول،
 *   فلا تُحتسب الإجابة الناقصة صحيحة بالكامل.
 */
export function gradeQuestion(
  q: Question,
  given: string | Record<string, string> | null | undefined,
): Graded {
  if (q.fields && q.fields.length > 0) {
    const obj = (given && typeof given === "object" ? given : {}) as Record<string, string>;
    const perField: Record<string, boolean> = {};
    let earned = 0;
    for (const f of q.fields) {
      const ok = (obj[f.key] ?? "") === f.answer;
      perField[f.key] = ok;
      if (ok) earned += 1;
    }
    return { earned, total: q.fields.length, correct: earned === q.fields.length, perField };
  }

  const value = typeof given === "string" ? given : "";
  if (q.options && q.options.length > 0) {
    const ok = value === q.answer;
    return { earned: ok ? 1 : 0, total: 1, correct: ok };
  }
  const ok = answerMatches(value, q.answer ?? "", q.acceptedAnswers);
  return { earned: ok ? 1 : 0, total: 1, correct: ok };
}

export function percent(earned: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((earned / total) * 100);
}

export function gradeLabel(p: number): { label: string; tone: string } {
  if (p >= 90) return { label: "ممتاز", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (p >= 80) return { label: "جيد جدًا", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (p >= 70) return { label: "جيد", tone: "text-brand-700 bg-brand-50 border-brand-200" };
  if (p >= 55) return { label: "مقبول", tone: "text-amber-700 bg-amber-50 border-amber-200" };
  return { label: "يحتاج مراجعة", tone: "text-rose-700 bg-rose-50 border-rose-200" };
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r} ثانية`;
  return `${m} دقيقة و${r} ثانية`;
}
