"use client";

import Link from "next/link";
import { useState } from "react";
import { DIFFICULTY_LABEL, TOPIC_SHORT, TYPE_LABEL } from "@/data/questionBank";
import { lessonTitle } from "@/data/lessons";
import { gradeQuestion } from "@/lib/scoring";
import { ruleLabel } from "@/lib/analysis";
import type { Question } from "@/lib/types";
import { Chip, He } from "./ui";

export type AnswerValue = string | Record<string, string> | null;

const isWriteType = (q: Question) => !q.options && !q.fields;

export function QuestionCard({
  question,
  value,
  onChange,
  revealed,
  showHints,
  index,
  total,
  readOnly = false,
}: {
  question: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  revealed: boolean;
  showHints: boolean;
  index?: number;
  total?: number;
  readOnly?: boolean;
}) {
  const [hintOpen, setHintOpen] = useState(false);
  const graded = revealed ? gradeQuestion(question, value) : null;

  const pick = (opt: string) => {
    if (readOnly || revealed) return;
    onChange(opt);
  };
  const pickField = (key: string, opt: string) => {
    if (readOnly || revealed) return;
    const obj = (value && typeof value === "object" ? { ...value } : {}) as Record<string, string>;
    obj[key] = opt;
    onChange(obj);
  };

  return (
    <article className="card p-4 sm:p-6">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        {typeof index === "number" && typeof total === "number" && (
          <span className="chip border-brand-200 bg-brand-50 text-brand-700">
            سؤال {index + 1} من {total}
          </span>
        )}
        <Chip tone="default">{TYPE_LABEL[question.type]}</Chip>
        <Chip tone="info">{TOPIC_SHORT[question.topic]}</Chip>
        <Chip
          tone={
            question.difficulty === "easy"
              ? "good"
              : question.difficulty === "medium"
                ? "default"
                : question.difficulty === "hard"
                  ? "warn"
                  : "bad"
          }
        >
          {DIFFICULTY_LABEL[question.difficulty]}
        </Chip>
        {graded && (
          <Chip tone={graded.correct ? "good" : graded.earned > 0 ? "warn" : "bad"}>
            {graded.correct
              ? "إجابة صحيحة"
              : graded.earned > 0
                ? `صحيح جزئيًا ${graded.earned} من ${graded.total}`
                : "إجابة خاطئة"}
          </Chip>
        )}
      </header>

      <h3 className="text-base font-semibold leading-8 sm:text-lg">{question.prompt}</h3>

      {question.hebrew && (
        <div className="mt-3 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-center">
          <He block>{question.hebrew}</He>
        </div>
      )}

      {/* خيارات الإجابة الواحدة */}
      {question.options && question.options.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {question.options.map((opt) => {
            const selected = value === opt;
            const isAnswer = revealed && opt === question.answer;
            const isWrongPick = revealed && selected && opt !== question.answer;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => pick(opt)}
                disabled={readOnly || revealed}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-right text-sm transition
                  ${isAnswer ? "border-emerald-300 bg-emerald-50" : ""}
                  ${isWrongPick ? "border-rose-300 bg-rose-50" : ""}
                  ${!revealed && selected ? "border-brand-400 bg-brand-50 ring-1 ring-brand-200" : ""}
                  ${!revealed && !selected ? "border-ink-200 bg-white hover:bg-ink-50" : ""}
                  ${revealed && !isAnswer && !isWrongPick ? "border-ink-200 bg-white opacity-70" : ""}`}
              >
                <span className={containsHebrew(opt) ? "he" : ""}>{opt}</span>
                {isAnswer && <span className="text-emerald-600">✔</span>}
                {isWrongPick && <span className="text-rose-600">✘</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* حقول متعددة: مطابقة / تحليل / سؤال مركّب */}
      {question.fields && question.fields.length > 0 && (
        <div className="mt-4 space-y-4">
          {question.fields.map((f) => {
            const chosen = (value && typeof value === "object" ? value[f.key] : "") ?? "";
            const ok = revealed && chosen === f.answer;
            const bad = revealed && chosen !== f.answer;
            return (
              <div key={f.key} className="rounded-xl border border-ink-200 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${containsHebrew(f.label) ? "he" : ""}`}>{f.label}</span>
                  {revealed && (
                    <span className={ok ? "text-xs text-emerald-600" : "text-xs text-rose-600"}>
                      {ok ? "صحيح" : `الصواب: ${f.answer}`}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {f.options.map((opt) => {
                    const selected = chosen === opt;
                    const isAnswer = revealed && opt === f.answer;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => pickField(f.key, opt)}
                        disabled={readOnly || revealed}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition
                          ${isAnswer ? "border-emerald-300 bg-emerald-50" : ""}
                          ${bad && selected ? "border-rose-300 bg-rose-50" : ""}
                          ${!revealed && selected ? "border-brand-400 bg-brand-50" : ""}
                          ${!revealed && !selected ? "border-ink-200 bg-white hover:bg-ink-50" : ""}
                          ${revealed && !isAnswer && !(bad && selected) ? "border-ink-200 bg-white opacity-70" : ""}`}
                      >
                        <span className={containsHebrew(opt) ? "he" : ""}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* أسئلة الكتابة */}
      {isWriteType(question) && (
        <div className="mt-4">
          <label className="label" htmlFor={`ans-${question.id}`}>
            اكتب إجابتك
          </label>
          <input
            id={`ans-${question.id}`}
            className={`input he ${revealed ? (graded?.correct ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50") : ""}`}
            dir="rtl"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => !revealed && !readOnly && onChange(e.target.value)}
            disabled={readOnly || revealed}
            placeholder="اكتب هنا…"
            autoComplete="off"
          />
          {revealed && (
            <p className="mt-2 text-sm">
              الإجابة الصحيحة: <strong className="he">{question.answer}</strong>
            </p>
          )}
        </div>
      )}

      {/* التلميح */}
      {showHints && !revealed && (
        <div className="mt-4">
          {hintOpen ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              💡 {question.hint}
            </div>
          ) : (
            <button type="button" className="btn-ghost" onClick={() => setHintOpen(true)}>
              إظهار التلميح
            </button>
          )}
        </div>
      )}

      {/* الشرح بعد الكشف */}
      {revealed && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-sm leading-7 text-brand-900">
            <div className="mb-1 font-bold">لماذا هذه الإجابة؟</div>
            <HebrewAwareText text={question.explanation} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Chip tone="default">القاعدة: {ruleLabel(question.ruleId)}</Chip>
            <Link
              href={`/learn/${question.lessonSlug}`}
              className="chip border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
            >
              فتح الدرس: {lessonTitle(question.lessonSlug)}
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}

function containsHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}

/** يعرض النص العربي مع إبراز المقاطع العبرية بخط عبري. */
export function HebrewAwareText({ text }: { text: string }) {
  const parts = text.split(/(«[^»]*»)/g);
  return (
    <span>
      {parts.map((p, i) => {
        if (p.startsWith("«") && p.endsWith("»") && containsHebrew(p)) {
          return (
            <span key={i} className="he font-semibold">
              {p}
            </span>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}
