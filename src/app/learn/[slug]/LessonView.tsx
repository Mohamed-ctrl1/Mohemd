"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppData } from "@/components/AppDataProvider";
import { Callout, Card, Chip, He, SectionTitle } from "@/components/ui";
import { HebrewAwareText } from "@/components/QuestionCard";
import { LESSONS, type Block } from "@/data/lessons";
import { QUESTION_BANK, TOPIC_SHORT } from "@/data/questionBank";

export function LessonView({ slug }: { slug: string }) {
  const { data, markLesson, setLastLesson } = useAppData();
  const lesson = useMemo(() => LESSONS.find((l) => l.slug === slug), [slug]);
  const index = LESSONS.findIndex((l) => l.slug === slug);
  const prev = index > 0 ? LESSONS[index - 1] : null;
  const next = index >= 0 && index < LESSONS.length - 1 ? LESSONS[index + 1] : null;

  useEffect(() => {
    if (lesson) setLastLesson(lesson.slug);
  }, [lesson, setLastLesson]);

  if (!lesson) return <p>الدرس غير موجود.</p>;
  const isDone = data.lessonsCompleted.includes(lesson.slug);
  const relatedCount = QUESTION_BANK.filter((q) => q.lessonSlug === lesson.slug).length;

  return (
    <article className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="he text-xl font-bold leading-10 sm:text-2xl">{lesson.title}</h1>
            <p className="mt-1 text-sm text-ink-600">{lesson.subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip tone="info">{lesson.level}</Chip>
              {lesson.topics.map((t) => (
                <Chip key={t}>{TOPIC_SHORT[t]}</Chip>
              ))}
              <Chip>{relatedCount} سؤالًا مرتبطًا</Chip>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className={isDone ? "btn-ghost" : "btn-primary"}
              onClick={() => markLesson(lesson.slug, !isDone)}
            >
              {isDone ? "إلغاء علامة الإكمال" : "تحديد كمكتمل ✔"}
            </button>
            <Link href={`/exam/setup?lesson=${lesson.slug}&count=10`} className="btn-soft">
              تدرّب على هذا الدرس
            </Link>
          </div>
        </div>
      </Card>

      {lesson.sections.map((section, si) => (
        <Card key={si} as="section">
          <SectionTitle title={`${si + 1}. ${section.title}`} />
          <div className="space-y-4">
            {section.blocks.map((b, bi) => (
              <BlockView key={bi} block={b} />
            ))}
          </div>
        </Card>
      ))}

      <nav className="flex flex-wrap items-center justify-between gap-3">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="btn-ghost">
            → الدرس السابق
          </Link>
        ) : (
          <span />
        )}
        <Link href="/learn" className="btn-ghost">
          كل الدروس
        </Link>
        {next ? (
          <Link href={`/learn/${next.slug}`} className="btn-primary">
            الدرس التالي ←
          </Link>
        ) : (
          <Link href="/exam/setup" className="btn-primary">
            ابدأ امتحانًا
          </Link>
        )}
      </nav>
    </article>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "text":
      return (
        <p className="text-sm leading-8 text-ink-700">
          <HebrewAwareText text={block.text} />
        </p>
      );
    case "list":
      return (
        <ul className="list-inside list-disc space-y-2 text-sm leading-8 text-ink-700">
          {block.items.map((it, i) => (
            <li key={i}>
              <HebrewAwareText text={it} />
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h} className={/[֐-׿]/.test(h) ? "he" : ""}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={block.hebrewCols?.includes(ci) || /[֐-׿]/.test(cell) ? "he" : ""}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "examples":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {block.items.map((it, i) => (
            <div key={i} className="rounded-xl border border-ink-200 bg-ink-50 p-3">
              <div className="he text-lg font-semibold">{it.he}</div>
              <div className="mt-1 text-sm text-ink-700">{it.ar}</div>
              {it.note && <div className="mt-1 text-xs text-ink-500">{it.note}</div>}
            </div>
          ))}
        </div>
      );
    case "callout":
      return (
        <Callout tone={block.tone} title={block.title}>
          <HebrewAwareText text={block.text} />
        </Callout>
      );
    case "exercise":
      return <ExerciseBlock items={block.items} />;
  }
}

function ExerciseBlock({ items }: { items: Extract<Block, { kind: "exercise" }>["items"] }) {
  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <MiniExercise key={i} item={it} n={i + 1} />
      ))}
    </div>
  );
}

function MiniExercise({ item, n }: { item: Extract<Block, { kind: "exercise" }>["items"][number]; n: number }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const revealed = picked !== null;

  return (
    <div data-testid="exercise" className="rounded-xl border border-ink-200 p-4">
      <p className="text-sm font-semibold leading-7">
        {n}. <HebrewAwareText text={item.q} />
      </p>
      {item.he && (
        <div className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-center">
          <He block>{item.he}</He>
        </div>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {item.options.map((opt) => {
          const isAnswer = revealed && opt === item.answer;
          const isWrong = revealed && picked === opt && opt !== item.answer;
          return (
            <button
              key={opt}
              type="button"
              disabled={revealed}
              onClick={() => setPicked(opt)}
              className={`rounded-lg border px-3 py-2 text-right text-sm transition
                ${isAnswer ? "border-emerald-300 bg-emerald-50" : ""}
                ${isWrong ? "border-rose-300 bg-rose-50" : ""}
                ${!revealed ? "border-ink-200 bg-white hover:bg-ink-50" : ""}
                ${revealed && !isAnswer && !isWrong ? "opacity-70" : ""}`}
            >
              <span className={/[֐-׿]/.test(opt) ? "he" : ""}>{opt}</span>
            </button>
          );
        })}
      </div>
      {!revealed && (
        <div className="mt-3">
          {hint ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">💡 {item.hint}</p>
          ) : (
            <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={() => setHint(true)}>
              إظهار التلميح
            </button>
          )}
        </div>
      )}
      {revealed && (
        <div className="mt-3 space-y-2">
          <p className={`text-xs font-bold ${picked === item.answer ? "text-emerald-700" : "text-rose-700"}`}>
            {picked === item.answer ? "إجابة صحيحة ✔" : "إجابة خاطئة ✘"}
          </p>
          <p className="rounded-lg border border-brand-200 bg-brand-50 p-2.5 text-xs leading-6 text-brand-900">
            <HebrewAwareText text={item.explanation} />
          </p>
          <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={() => { setPicked(null); setHint(false); }}>
            إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
}
