"use client";

import Link from "next/link";
import { useAppData } from "@/components/AppDataProvider";
import { Card, Chip, EmptyState, LineChart, SectionTitle, StatCard } from "@/components/ui";
import { DIFFICULTY_LABEL, TOPIC_SHORT } from "@/data/questionBank";
import { formatDuration, gradeLabel } from "@/lib/scoring";
import { overview } from "@/lib/analysis";

export default function HistoryPage() {
  const { data } = useAppData();
  const exams = [...data.exams].sort((a, b) => b.finishedAt - a.finishedAt);
  const ov = overview(data);

  if (!exams.length) {
    return (
      <EmptyState
        title="لا يوجد سجل بعد"
        desc="بعد أول امتحان ستجد هنا كل العلامات والتواريخ والإعدادات، مع إمكانية فتح تصحيح أي امتحان قديم."
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
        <SectionTitle title="سجل الامتحانات" subtitle="كل امتحان سلّمته، مع إمكانية فتح التصحيح التفصيلي." />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="عدد الامتحانات" value={exams.length} />
          <StatCard label="أعلى علامة" value={`${Math.max(...exams.map((e) => e.scorePercent))}/100`} tone="good" />
          <StatCard label="أدنى علامة" value={`${Math.min(...exams.map((e) => e.scorePercent))}/100`} tone="bad" />
          <StatCard label="المتوسط" value={`${ov.avgScore ?? 0}/100`} />
        </div>
        <div className="mt-4">
          <LineChart points={[...exams].reverse().map((e, i) => ({ x: String(i + 1), y: e.scorePercent }))} />
        </div>
      </Card>

      <div className="space-y-3">
        {exams.map((e) => {
          const g = gradeLabel(e.scorePercent);
          return (
            <Card key={e.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold">{e.title}</h3>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {new Date(e.finishedAt).toLocaleString("ar-EG")} · {formatDuration(e.durationMs)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <Chip tone="good">{e.correctCount} صحيح</Chip>
                    <Chip tone="bad">{e.wrongCount} خطأ</Chip>
                    <Chip>{e.earned}/{e.total} نقطة</Chip>
                    <Chip>
                      {e.config.topics.length
                        ? e.config.topics.map((t) => TOPIC_SHORT[t]).join("، ")
                        : "كل الموضوعات"}
                    </Chip>
                    <Chip>
                      {e.config.difficulties.length
                        ? e.config.difficulties.map((d) => DIFFICULTY_LABEL[d]).join("، ")
                        : "كل المستويات"}
                    </Chip>
                    {e.config.timerMinutes && <Chip>مؤقت {e.config.timerMinutes} دقيقة</Chip>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded-xl border px-3 py-2 text-center text-sm font-bold ${g.tone}`}>
                    {e.scorePercent}/100
                  </span>
                  <Link href={`/exam/results/${e.id}`} className="btn-ghost">
                    التصحيح
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
