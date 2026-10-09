"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAppData } from "@/components/AppDataProvider";
import { QuestionCard } from "@/components/QuestionCard";
import { BarChart, Card, Chip, EmptyState, SectionTitle, StatCard } from "@/components/ui";
import { QUESTION_BY_ID, TOPIC_SHORT } from "@/data/questionBank";
import { formatDuration, gradeLabel, percent } from "@/lib/scoring";
import { ruleLabel } from "@/lib/analysis";
import type { Topic } from "@/lib/types";

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, ready, setActiveExam } = useAppData();
  const exam = data.exams.find((e) => e.id === id);

  const byTopic = useMemo(() => {
    if (!exam) return [];
    const map = new Map<Topic, { earned: number; total: number }>();
    for (const it of exam.items) {
      const q = QUESTION_BY_ID.get(it.qid);
      if (!q) continue;
      const cur = map.get(q.topic) ?? { earned: 0, total: 0 };
      cur.earned += it.earned;
      cur.total += it.total;
      map.set(q.topic, cur);
    }
    return [...map.entries()].map(([topic, v]) => ({
      topic,
      label: TOPIC_SHORT[topic],
      value: percent(v.earned, v.total),
      raw: v,
    }));
  }, [exam]);

  const wrongItems = useMemo(() => exam?.items.filter((it) => !it.correct) ?? [], [exam]);
  const brokenRules = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of wrongItems) {
      const q = QUESTION_BY_ID.get(it.qid);
      if (!q) continue;
      map.set(q.ruleId, (map.get(q.ruleId) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [wrongItems]);

  if (!ready) return <p className="text-sm text-ink-500">جارٍ التحميل…</p>;
  if (!exam) {
    return (
      <EmptyState
        title="النتيجة غير موجودة"
        desc="قد تكون حذفت بياناتك أو فتحت الرابط على جهاز آخر. البيانات محفوظة محليًا في المتصفح."
        action={
          <Link href="/history" className="btn-primary mt-2">
            سجل الامتحانات
          </Link>
        }
      />
    );
  }

  const g = gradeLabel(exam.scorePercent);
  const weakestTopics = [...byTopic].sort((a, b) => a.value - b.value).slice(0, 3).map((t) => t.topic);

  const retryWrong = () => {
    if (!wrongItems.length) return;
    const qids = wrongItems.map((it) => it.qid);
    setActiveExam({
      id: `exam-${Date.now()}`,
      title: `إعادة حل الأسئلة الخاطئة — ${qids.length} أسئلة`,
      startedAt: Date.now(),
      qids,
      answers: {},
      index: 0,
      config: { ...exam.config, count: qids.length, mode: "mistakes", instantFeedback: true, timerMinutes: null },
      revealed: [],
    });
    router.push("/exam/run");
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold sm:text-xl">{exam.title}</h1>
            <p className="mt-1 text-xs text-ink-500">
              {new Date(exam.finishedAt).toLocaleString("ar-EG")} · استغرق {formatDuration(exam.durationMs)}
            </p>
          </div>
          <div className={`rounded-2xl border px-5 py-3 text-center ${g.tone}`}>
            <div className="text-3xl font-bold">{exam.scorePercent}</div>
            <div className="text-xs font-semibold">من 100 — {g.label}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="إجابات صحيحة بالكامل" value={exam.correctCount} tone="good" />
        <StatCard label="إجابات خاطئة أو ناقصة" value={exam.wrongCount} tone="bad" />
        <StatCard label="نسبة النجاح" value={`${exam.scorePercent}%`} hint="النقاط المحصّلة من مجموع النقاط" />
        <StatCard label="النقاط" value={`${exam.earned}/${exam.total}`} hint="وحدة لكل سؤال، ووحدة لكل حقل في الأسئلة المركّبة" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="العلامة لكل موضوع" />
          <BarChart items={byTopic.map((t) => ({ label: `${t.label} (${t.raw.earned}/${t.raw.total})`, value: t.value, tone: t.value >= 70 ? "good" : t.value >= 50 ? "warn" : "bad" }))} />
        </Card>
        <Card>
          <SectionTitle title="القواعد التي أخطأت في تطبيقها" />
          {brokenRules.length === 0 ? (
            <p className="text-sm text-emerald-700">لا أخطاء في هذا الامتحان. أداء ممتاز.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {brokenRules.map(([rid, n]) => (
                <li key={rid} className="flex items-center justify-between gap-2 rounded-xl border border-ink-200 px-3 py-2">
                  <span>{ruleLabel(rid)}</span>
                  <Chip tone="bad">{n} خطأ</Chip>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={retryWrong} disabled={!wrongItems.length}>
              إعادة حل الأسئلة الخاطئة ({wrongItems.length})
            </button>
            <Link href={`/exam/setup?mode=custom&topics=${weakestTopics.join(",")}&count=15`} className="btn-ghost">
              امتحان جديد من المواضيع الضعيفة
            </Link>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="التصحيح التفصيلي"
          subtitle="لكل سؤال: إجابتك، الإجابة الصحيحة، شرح السبب، والقاعدة والدرس المرتبطان."
        />
        <div className="space-y-4">
          {exam.items.map((it, i) => {
            const q = QUESTION_BY_ID.get(it.qid);
            if (!q) return null;
            return (
              <div key={it.qid}>
                <div className="mb-1 flex items-center gap-2 text-xs text-ink-500">
                  <span>السؤال {i + 1}</span>
                  <span>·</span>
                  <span>{it.earned}/{it.total} نقطة</span>
                  {it.given === null && <Chip tone="warn">لم تُجب</Chip>}
                </div>
                <QuestionCard
                  question={q}
                  value={it.given}
                  onChange={() => {}}
                  revealed
                  showHints={false}
                  readOnly
                />
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link href="/exam/setup" className="btn-primary">
          امتحان جديد
        </Link>
        <Link href="/weakness" className="btn-ghost">
          تحليل نقاط الضعف
        </Link>
        <Link href="/mistakes" className="btn-ghost">
          دفتر الأخطاء
        </Link>
        <Link href="/history" className="btn-ghost">
          سجل الامتحانات
        </Link>
      </div>
    </div>
  );
}
