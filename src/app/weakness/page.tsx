"use client";

import Link from "next/link";
import { useAppData } from "@/components/AppDataProvider";
import { Callout, Card, Chip, ProgressBar, SectionTitle } from "@/components/ui";
import { reviewPlan, rulePatterns, ruleLabel, topicStats } from "@/lib/analysis";
import { TOPIC_LABEL } from "@/data/questionBank";

const STATUS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "default" | "info" }> = {
  strong: { label: "نقطة قوة", tone: "good" },
  ok: { label: "مقبول", tone: "info" },
  weak: { label: "يحتاج مراجعة", tone: "bad" },
  "low-data": { label: "بيانات غير كافية", tone: "warn" },
  "no-data": { label: "لم تبدأ بعد", tone: "default" },
};

export default function WeaknessPage() {
  const { data } = useAppData();
  const stats = topicStats(data);
  const patterns = rulePatterns(data);
  const top = stats.find((s) => s.status === "weak") ?? stats.find((s) => s.status === "ok") ?? stats[0];

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle
          title="نقاط ضعفي"
          subtitle="المواضيع مرتبة من الأكثر حاجة إلى المراجعة إلى الأقل، مع درجة ثقة في التقييم."
        />
        <Callout tone="info" title="كيف يُحسب التقييم؟">
          لا يُصنّف موضوع ضعيفًا بسبب خطأ واحد. يحتاج الحكم 6 إجابات على الأقل، وتزيد درجة الثقة حتى
          14 إجابة. نقص البيانات يظهر كحالة مستقلة، لا كضعف في الأداء.
        </Callout>
      </Card>

      <div className="space-y-3">
        {stats.map((s) => {
          const st = STATUS[s.status];
          return (
            <Card key={s.topic}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className={`text-sm font-bold ${/[֐-׿]/.test(TOPIC_LABEL[s.topic]) ? "he" : ""}`}>
                    {TOPIC_LABEL[s.topic]}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <Chip tone={st.tone}>{st.label}</Chip>
                    <Chip>حللت {s.attempted} من {s.available} متاح</Chip>
                    <Chip>نسبة الصحيح {Math.round(s.rate * 100)}%</Chip>
                    <Chip>آخر 10: {Math.round(s.lastRate * 100)}%</Chip>
                    {s.trend !== 0 && (
                      <Chip tone={s.trend > 0 ? "good" : "bad"}>
                        {s.trend > 0 ? "▲ تحسّن" : "▼ تراجع"} {Math.abs(Math.round(s.trend * 100))}%
                      </Chip>
                    )}
                    <Chip tone={s.confidence >= 0.8 ? "good" : s.confidence >= 0.4 ? "warn" : "default"}>
                      ثقة التقييم {Math.round(s.confidence * 100)}%
                    </Chip>
                  </div>
                  <div className="mt-3 max-w-md">
                    <ProgressBar
                      value={s.attempted ? s.rate * 100 : 0}
                      tone={s.rate >= 0.85 ? "good" : s.rate >= 0.7 ? "brand" : s.rate >= 0.5 ? "warn" : "bad"}
                    />
                  </div>
                </div>
                <Link href={`/exam/setup?topics=${s.topic}&count=10`} className="btn-soft shrink-0">
                  تدرّب على هذا الموضوع
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {patterns.length > 0 && (
        <Card>
          <SectionTitle title="أنماط الخطأ التفصيلية" subtitle="على مستوى القاعدة لا الموضوع، وهي أدق في تحديد سبب الخطأ." />
          <ul className="space-y-2 text-sm">
            {patterns.slice(0, 10).map((p) => (
              <li key={p.ruleId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-200 px-3 py-2">
                <span>{ruleLabel(p.ruleId)}</span>
                <span className="flex gap-1.5">
                  <Chip tone="bad">{p.wrong} خطأ من {p.total}</Chip>
                  <Chip>{Math.round(p.rate * 100)}% نسبة الخطأ</Chip>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {top && (
        <Card>
          <SectionTitle
            title={`خطة مراجعة مقترحة — ${top.label}`}
            subtitle="تتحدّث الخطة تلقائيًا بعد كل امتحان بناءً على أدائك."
          />
          <ol className="space-y-3">
            {reviewPlan(top).map((step) => (
              <li key={step.title} className="rounded-xl border border-ink-200 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold">{step.title}</h4>
                    <p className="mt-0.5 text-xs leading-6 text-ink-600">{step.detail}</p>
                  </div>
                  <Link href={step.href} className="btn-ghost shrink-0 !py-1.5 !text-xs">
                    {step.cta}
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
