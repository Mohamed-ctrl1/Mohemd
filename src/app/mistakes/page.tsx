"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppData } from "@/components/AppDataProvider";
import { QuestionCard } from "@/components/QuestionCard";
import { Callout, Card, Chip, EmptyState, SectionTitle, StatCard } from "@/components/ui";
import { QUESTION_BY_ID, TOPIC_SHORT } from "@/data/questionBank";
import { SRS_INTERVALS_DAYS } from "@/lib/storage";
import { buildMistakeExam } from "@/lib/selection";

export default function MistakesPage() {
  const { data, setActiveExam } = useAppData();
  const router = useRouter();
  const [filter, setFilter] = useState<"due" | "open" | "mastered">("due");
  const now = Date.now();

  const all = Object.values(data.mistakes);
  const open = all.filter((m) => !m.mastered);
  const due = open.filter((m) => m.nextReviewAt <= now);
  const mastered = all.filter((m) => m.mastered);
  const list = filter === "due" ? due : filter === "open" ? open : mastered;

  const start = (mode: "due" | "all") => {
    const source = mode === "due" ? due : open;
    if (!source.length) return;
    const questions = buildMistakeExam(data, Math.min(20, source.length));
    if (!questions.length) return;
    setActiveExam({
      id: `exam-${Date.now()}`,
      title: mode === "due" ? `تدرّب على أخطائي — ${questions.length} أسئلة` : `اختبرني فيما تعلمته — ${questions.length} أسئلة`,
      startedAt: Date.now(),
      qids: questions.map((q) => q.id),
      answers: {},
      index: 0,
      config: {
        count: questions.length,
        topics: [],
        difficulties: [],
        showHints: mode === "due",
        instantFeedback: mode === "due",
        timerMinutes: null,
        mode: "mistakes",
        lessonSlug: null,
      },
      revealed: [],
    });
    router.push("/exam/run");
  };

  if (!all.length) {
    return (
      <EmptyState
        title="دفتر الأخطاء فارغ"
        desc="كل سؤال تخطئ فيه يُحفظ هنا تلقائيًا مع إجابتك والإجابة الصحيحة وشرح القاعدة، ويعود للظهور بنظام مراجعة متباعدة."
        action={
          <Link href="/exam/setup" className="btn-primary mt-2">
            ابدأ امتحانًا
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle title="مراجعة الأخطاء" subtitle="كل خطأ يُحفظ تلقائيًا، ويعود للمراجعة بفواصل زمنية متزايدة." />
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="مستحقّ المراجعة الآن" value={due.length} tone={due.length ? "warn" : "good"} />
          <StatCard label="غير متمكَّن" value={open.length} />
          <StatCard label="أتقنته" value={mastered.length} tone="good" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => start("due")} disabled={!due.length}>
            تدرّب فقط على أخطائي
          </button>
          <button type="button" className="btn-ghost" onClick={() => start("all")} disabled={!open.length}>
            اختبرني فيما تعلمته
          </button>
        </div>
        <Callout tone="info" title="نظام المراجعة المتباعدة">
          بعد كل إجابة صحيحة ينتقل السؤال إلى صندوق أعلى فتطول فترة عودته:{" "}
          {SRS_INTERVALS_DAYS.slice(1).map((d) => `${d} يوم`).join(" ← ")}. ويُعدّ السؤال متمكَّنًا بعد
          ثلاث إجابات صحيحة.
        </Callout>
      </Card>

      <div className="flex flex-wrap gap-2">
        {([
          ["due", `مستحقّ الآن (${due.length})`],
          ["open", `كل الأخطاء (${open.length})`],
          ["mastered", `أتقنته (${mastered.length})`],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`rounded-xl border px-3.5 py-2 text-sm font-medium ${
              filter === k ? "border-brand-400 bg-brand-50 text-brand-800" : "border-ink-200 bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">
            {filter === "due"
              ? "لا يوجد سؤال مستحقّ للمراجعة الآن. عد لاحقًا، أو اختر «كل الأخطاء»."
              : "لا توجد عناصر في هذه القائمة."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {list
            .sort((a, b) => b.timesWrong - a.timesWrong || a.nextReviewAt - b.nextReviewAt)
            .map((m) => {
              const q = QUESTION_BY_ID.get(m.qid);
              if (!q) return null;
              let given: string | Record<string, string> | null = null;
              try {
                given = m.lastAnswer?.startsWith("{") ? JSON.parse(m.lastAnswer) : m.lastAnswer;
              } catch {
                given = m.lastAnswer;
              }
              return (
                <div key={m.qid}>
                  <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <Chip tone="bad">أخطأت {m.timesWrong} مرة</Chip>
                    {m.timesRight > 0 && <Chip tone="good">صحّحت {m.timesRight} مرة</Chip>}
                    <Chip>{TOPIC_SHORT[m.topic]}</Chip>
                    <Chip>آخر خطأ: {new Date(m.lastWrongAt).toLocaleDateString("ar-EG")}</Chip>
                    <Chip tone={m.nextReviewAt <= now ? "warn" : "default"}>
                      {m.mastered
                        ? "متمكَّن"
                        : m.nextReviewAt <= now
                          ? "مستحقّ للمراجعة الآن"
                          : `المراجعة القادمة: ${new Date(m.nextReviewAt).toLocaleDateString("ar-EG")}`}
                    </Chip>
                    <Chip>الصندوق {m.box}/5</Chip>
                  </div>
                  <QuestionCard question={q} value={given} onChange={() => {}} revealed showHints={false} readOnly />
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
