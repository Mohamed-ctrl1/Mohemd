"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppData } from "@/components/AppDataProvider";
import { QuestionCard, type AnswerValue } from "@/components/QuestionCard";
import { Callout, Card, Chip, EmptyState, ProgressBar } from "@/components/ui";
import { QUESTION_BY_ID } from "@/data/questionBank";
import { gradeQuestion, percent } from "@/lib/scoring";
import type { ExamItem, ExamRecord } from "@/lib/storage";

export default function RunExamPage() {
  const router = useRouter();
  const { data, ready, setActiveExam, saveExam, recordAnswers } = useAppData();
  const active = data.activeExam;

  const [confirming, setConfirming] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const submittedRef = useRef(false);

  const questions = useMemo(
    () => (active ? active.qids.map((id) => QUESTION_BY_ID.get(id)).filter((q) => !!q) : []),
    [active],
  );

  const submit = useCallback(() => {
    if (!active || submittedRef.current) return;
    submittedRef.current = true;
    const items: ExamItem[] = [];
    let earned = 0;
    let total = 0;
    let correctCount = 0;
    const toRecord: { question: NonNullable<ReturnType<typeof QUESTION_BY_ID.get>>; given: AnswerValue }[] = [];
    for (const q of questions) {
      const given = active.answers[q.id] ?? null;
      const g = gradeQuestion(q, given);
      earned += g.earned;
      total += g.total;
      if (g.correct) correctCount += 1;
      items.push({ qid: q.id, given, earned: g.earned, total: g.total, correct: g.correct });
      toRecord.push({ question: q, given });
    }
    const finishedAt = Date.now();
    const record: ExamRecord = {
      id: active.id,
      title: active.title,
      startedAt: active.startedAt,
      finishedAt,
      durationMs: finishedAt - active.startedAt,
      scorePercent: percent(earned, total),
      earned,
      total,
      correctCount,
      wrongCount: questions.length - correctCount,
      items,
      config: active.config,
    };
    recordAnswers(toRecord, active.id);
    saveExam(record);
    router.push(`/exam/results?id=${encodeURIComponent(active.id)}`);
  }, [active, questions, recordAnswers, saveExam, router]);

  // المؤقت
  useEffect(() => {
    if (!active?.config.timerMinutes) {
      setTimeLeft(null);
      return;
    }
    const endAt = active.startedAt + active.config.timerMinutes * 60_000;
    const tick = () => setTimeLeft(Math.max(0, endAt - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [active?.config.timerMinutes, active?.startedAt]);

  useEffect(() => {
    if (timeLeft === 0 && active && !submittedRef.current) submit();
  }, [timeLeft, active, submit]);

  if (!ready) return <p className="text-sm text-ink-500">جارٍ تحميل الامتحان…</p>;

  if (!active || questions.length === 0) {
    return (
      <EmptyState
        title="لا يوجد امتحان جارٍ"
        desc="ابدأ امتحانًا جديدًا من صفحة الإعداد، واختر عدد الأسئلة والموضوعات ومستوى الصعوبة."
        action={
          <Link href="/exam/setup" className="btn-primary mt-2">
            إعداد امتحان
          </Link>
        }
      />
    );
  }

  const index = Math.min(active.index, questions.length - 1);
  const current = questions[index];
  const answeredCount = questions.filter((q) => {
    const v = active.answers[q.id];
    if (v === undefined || v === null) return false;
    if (typeof v === "string") return v.trim() !== "";
    return Object.values(v).some((x) => x);
  }).length;
  const revealed = active.revealed.includes(current.id);

  const setAnswer = (v: AnswerValue) => {
    if (v === null) return;
    setActiveExam({ ...active, answers: { ...active.answers, [current.id]: v } });
  };

  const go = (i: number) => setActiveExam({ ...active, index: Math.max(0, Math.min(questions.length - 1, i)) });

  const revealCurrent = () => setActiveExam({ ...active, revealed: [...active.revealed, current.id] });

  const hasAnswer = (() => {
    const v = active.answers[current.id];
    if (v === undefined || v === null) return false;
    if (typeof v === "string") return v.trim() !== "";
    return current.fields ? current.fields.every((f) => v[f.key]) : Object.values(v).some((x) => x);
  })();

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold">{active.title}</h1>
            <p className="text-xs text-ink-500">إجاباتك تُحفظ تلقائيًا، ويمكنك التنقل وتغيير أي إجابة قبل التسليم.</p>
          </div>
          <div className="flex items-center gap-2">
            {timeLeft !== null && (
              <Chip tone={timeLeft < 60_000 ? "bad" : timeLeft < 180_000 ? "warn" : "info"}>
                ⏱ {formatClock(timeLeft)}
              </Chip>
            )}
            <Chip>
              {answeredCount}/{questions.length} مُجاب
            </Chip>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={((index + 1) / questions.length) * 100} />
        </div>
      </Card>

      <QuestionCard
        question={current}
        value={active.answers[current.id] ?? null}
        onChange={setAnswer}
        revealed={revealed}
        showHints={active.config.showHints}
        index={index}
        total={questions.length}
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={() => go(index - 1)} disabled={index === 0}>
              → السابق
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => go(index + 1)}
              disabled={index === questions.length - 1}
            >
              التالي ←
            </button>
          </div>
          <div className="flex gap-2">
            {active.config.instantFeedback && !revealed && (
              <button type="button" className="btn-soft" onClick={revealCurrent} disabled={!hasAnswer}>
                تحقّق من الإجابة
              </button>
            )}
            {active.config.instantFeedback && revealed && index < questions.length - 1 && (
              <button type="button" className="btn-primary" onClick={() => go(index + 1)}>
                السؤال التالي ←
              </button>
            )}
            <button type="button" className="btn-primary" onClick={() => setConfirming(true)}>
              تسليم الامتحان
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {questions.map((q, i) => {
            const v = active.answers[q.id];
            const done = v !== undefined && v !== null && (typeof v === "string" ? v.trim() !== "" : Object.values(v).some((x) => x));
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`السؤال ${i + 1}`}
                className={`h-8 w-8 rounded-lg border text-xs font-semibold transition ${
                  i === index
                    ? "border-brand-500 bg-brand-600 text-white"
                    : done
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-ink-200 bg-white text-ink-500"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </Card>

      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4">
          <div className="card w-full max-w-md p-5">
            <h2 className="text-base font-bold">تأكيد التسليم</h2>
            <p className="mt-2 text-sm leading-7 text-ink-600">
              أجبت على {answeredCount} من {questions.length} سؤالًا.
              {answeredCount < questions.length && " الأسئلة غير المُجابة ستُحسب خاطئة."}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>
                رجوع للامتحان
              </button>
              <button type="button" className="btn-primary" onClick={submit}>
                تسليم ونتيجة
              </button>
            </div>
          </div>
        </div>
      )}

      {timeLeft !== null && timeLeft < 60_000 && (
        <Callout tone="warn" title="بقيت أقل من دقيقة">
          سيُسلَّم الامتحان تلقائيًا عند انتهاء الوقت، وستُحسب الإجابات المسجّلة فقط.
        </Callout>
      )}
    </div>
  );
}

function formatClock(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
