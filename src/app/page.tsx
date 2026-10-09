"use client";

import Link from "next/link";
import { useAppData } from "@/components/AppDataProvider";
import { ActionTile, BarChart, Card, Chip, LineChart, ProgressBar, SectionTitle, StatCard } from "@/components/ui";
import { overview, topicStats } from "@/lib/analysis";
import { formatDuration, gradeLabel } from "@/lib/scoring";
import { QUESTION_BANK } from "@/data/questionBank";
import { LESSONS, lessonTitle } from "@/data/lessons";

export default function HomePage() {
  const { data, ready } = useAppData();
  const ov = overview(data);
  const stats = topicStats(data);
  const exams = [...data.exams].sort((a, b) => b.finishedAt - a.finishedAt);
  const strong = stats.filter((s) => s.status === "strong");
  const weak = stats.filter((s) => s.status === "weak");

  return (
    <div className="space-y-8">
      <section className="card overflow-hidden p-0">
        <div className="bg-gradient-to-l from-brand-700 to-brand-500 p-6 text-white sm:p-8">
          <h1 className="text-xl font-bold sm:text-2xl">منصة التحضير لامتحان اللغة العبرية</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-50">
            تدريب مركّز على <span className="he font-semibold">הבניינים</span> السبعة،
            و<span className="he font-semibold">הפועל</span>، و
            <span className="he font-semibold">פעיל וסביל</span>، وجذور الأفعال وتصريفها،
            وتحليل الفعل داخل الجملة — مع شرح عربي، وامتحانات مدرّجة الصعوبة، وتحليل دقيق لنقاط ضعفك.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/15 px-3 py-1">{QUESTION_BANK.length} سؤال في البنك</span>
            <span className="rounded-full bg-white/15 px-3 py-1">{LESSONS.length} درسًا</span>
            <span className="rounded-full bg-white/15 px-3 py-1">7 أوزان بالتفصيل</span>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle title="لوحة التحكم" subtitle="أرقامك الحقيقية، محفوظة في متصفحك." />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="آخر علامة"
            value={ov.lastScore === null ? "—" : `${ov.lastScore}/100`}
            hint={ov.lastScore === null ? "لم تُجرِ امتحانًا بعد" : gradeLabel(ov.lastScore).label}
            tone={ov.lastScore === null ? "default" : ov.lastScore >= 70 ? "good" : ov.lastScore >= 55 ? "warn" : "bad"}
          />
          <StatCard
            label="متوسط العلامات"
            value={ov.avgScore === null ? "—" : `${ov.avgScore}/100`}
            hint={`${ov.examsCount} امتحانًا`}
          />
          <StatCard
            label="نسبة الإجابات الصحيحة"
            value={`${Math.round(ov.correctRate * 100)}%`}
            hint="محسوبة على كل الأسئلة التي حللتها"
            tone={ov.correctRate >= 0.7 ? "good" : ov.correctRate >= 0.55 ? "warn" : "bad"}
          />
          <StatCard label="عدد الأسئلة المحلولة" value={ov.totalAnswered} hint={`أفضل سلسلة صحيحة: ${ov.streakBest}`} />
        </div>
      </section>

      {ready && data.activeExam && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-amber-900">يوجد امتحان غير مكتمل</h3>
              <p className="text-xs text-amber-800">
                {data.activeExam.title} — أجبت على {Object.keys(data.activeExam.answers).length} من{" "}
                {data.activeExam.qids.length} سؤالًا. إجاباتك محفوظة تلقائيًا.
              </p>
            </div>
            <Link href="/exam/run" className="btn-primary">
              متابعة الامتحان
            </Link>
          </div>
        </Card>
      )}

      <section>
        <SectionTitle title="ابدأ من هنا" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionTile href="/exam/setup" title="ابدأ امتحانًا" desc="سريع 10، تدريبي 20، شامل 40، أو مخصص بالكامل." icon="📝" tone="brand" />
          <ActionTile href="/learn" title="تعلّم المادة" desc="شرح الأوزان السبعة والمعلوم والمجهول من الصفر." icon="📚" tone="ink" />
          <ActionTile
            href="/exam/setup?mode=weakness"
            title="تدرّب على نقاط ضعفك"
            desc="امتحان يُبنى من المواضيع التي يحتاج أداؤك فيها تحسينًا."
            icon="🎯"
            tone="amber"
          />
          <ActionTile
            href="/mistakes"
            title="مراجعة الأخطاء"
            desc={`${ov.openMistakes} خطأ غير متمكَّن، منها ${ov.dueReviews} مستحقّ للمراجعة الآن.`}
            icon="🔁"
            tone="emerald"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="تقدّمك في كل موضوع" subtitle="النسبة = الإجابات الصحيحة من مجموع ما حللته." />
          <BarChart
            items={stats.map((s) => ({
              label: `${s.label} (${s.attempted})`,
              value: s.attempted ? s.rate * 100 : 0,
              tone: !s.attempted ? "brand" : s.rate >= 0.85 ? "good" : s.rate >= 0.7 ? "brand" : s.rate >= 0.5 ? "warn" : "bad",
            }))}
          />
          <Link href="/weakness" className="btn-soft mt-4 w-full">
            تفاصيل نقاط الضعف وخطة المراجعة
          </Link>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle title="نقاط القوة" />
            {strong.length ? (
              <div className="flex flex-wrap gap-2">
                {strong.map((s) => (
                  <Chip key={s.topic} tone="good">
                    {s.label} — {Math.round(s.rate * 100)}%
                  </Chip>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-500">
                لا توجد نقاط قوة مؤكدة بعد. يحتاج الموضوع 6 إجابات على الأقل ونسبة 85% للحكم عليه.
              </p>
            )}
          </Card>
          <Card>
            <SectionTitle title="تحتاج تحسينًا" />
            {weak.length ? (
              <div className="space-y-3">
                {weak.slice(0, 4).map((s) => (
                  <div key={s.topic}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{s.label}</span>
                      <span className="text-ink-500">
                        {Math.round(s.rate * 100)}% من {s.attempted} سؤالًا
                      </span>
                    </div>
                    <ProgressBar value={s.rate * 100} tone="bad" />
                  </div>
                ))}
                <Link href="/exam/setup?mode=weakness" className="btn-primary w-full">
                  امتحان على نقاط الضعف
                </Link>
              </div>
            ) : (
              <p className="text-sm text-ink-500">
                لا يوجد موضوع مصنّف ضعيفًا. التصنيف لا يُبنى على خطأ واحد، بل على عدد كافٍ من الإجابات.
              </p>
            )}
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="تطور العلامات" subtitle="كل نقطة امتحان واحد." />
          <LineChart points={[...data.exams].sort((a, b) => a.finishedAt - b.finishedAt).map((e, i) => ({ x: String(i + 1), y: e.scorePercent }))} />
        </Card>
        <Card>
          <SectionTitle
            title="سجل الامتحانات السابقة"
            action={
              exams.length ? (
                <Link href="/history" className="text-sm font-semibold text-brand-700">
                  السجل الكامل
                </Link>
              ) : undefined
            }
          />
          {exams.length === 0 ? (
            <p className="text-sm text-ink-500">لا توجد امتحانات بعد. ابدأ بامتحان سريع من 10 أسئلة.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {exams.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/exam/results?id=${encodeURIComponent(e.id)}`} className="block truncate text-sm font-semibold text-brand-700">
                      {e.title}
                    </Link>
                    <div className="text-[11px] text-ink-500">
                      {new Date(e.finishedAt).toLocaleString("ar-EG")} · {formatDuration(e.durationMs)}
                    </div>
                  </div>
                  <Chip tone={e.scorePercent >= 70 ? "good" : e.scorePercent >= 55 ? "warn" : "bad"}>
                    {e.scorePercent}/100
                  </Chip>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {data.lastLesson && (
        <Card className="border-brand-200 bg-brand-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-brand-900">
              آخر درس كنت تتعلم منه: <strong>{lessonTitle(data.lastLesson)}</strong>
            </p>
            <Link href={`/learn/${data.lastLesson}`} className="btn-primary">
              متابعة الدرس
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
