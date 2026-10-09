"use client";

import Link from "next/link";
import { useAppData } from "@/components/AppDataProvider";
import { Card, Chip, ProgressBar, SectionTitle } from "@/components/ui";
import { LESSONS } from "@/data/lessons";
import { TOPIC_SHORT } from "@/data/questionBank";

export default function LearnIndexPage() {
  const { data } = useAppData();
  const done = new Set(data.lessonsCompleted);
  const pct = Math.round((done.size / LESSONS.length) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          title="شرح المادة من الصفر إلى المستوى المتقدم"
          subtitle="كل درس مقسّم إلى أجزاء قصيرة: شرح، ثم أمثلة، ثم تمرين فوري."
        />
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ProgressBar value={pct} tone={pct === 100 ? "good" : "brand"} />
          </div>
          <span className="text-sm font-semibold">
            {done.size}/{LESSONS.length}
          </span>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {LESSONS.map((l) => (
          <Link key={l.slug} href={`/learn/${l.slug}`} className="card p-4 transition hover:border-brand-300 hover:bg-brand-50/40">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="he text-base font-bold leading-8">{l.title}</h3>
              {done.has(l.slug) && <Chip tone="good">مكتمل ✔</Chip>}
            </div>
            <p className="text-sm leading-7 text-ink-600">{l.subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip tone="info">{l.level}</Chip>
              {l.topics.map((t) => (
                <Chip key={t}>{TOPIC_SHORT[t]}</Chip>
              ))}
              <Chip>{l.sections.length} أقسام</Chip>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
