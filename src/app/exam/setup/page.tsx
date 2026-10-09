"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAppData } from "@/components/AppDataProvider";
import { Callout, Card, Chip, SectionTitle } from "@/components/ui";
import {
  ALL_DIFFICULTIES,
  ALL_TOPICS,
  DIFFICULTY_LABEL,
  QUESTION_BANK,
  TOPIC_LABEL,
} from "@/data/questionBank";
import { LESSONS, lessonTitle } from "@/data/lessons";
import { EXAM_PRESETS, buildExam, weakTopics } from "@/lib/selection";
import type { ExamConfig } from "@/lib/storage";
import { DEFAULT_CONFIG } from "@/lib/storage";
import type { Difficulty, Topic } from "@/lib/types";

export default function SetupPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-500">جارٍ التحميل…</p>}>
      <SetupInner />
    </Suspense>
  );
}

function SetupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { data, setActiveExam, updateSettings } = useAppData();

  const [config, setConfig] = useState<ExamConfig>(() => ({ ...DEFAULT_CONFIG, ...data.settings }));
  const [error, setError] = useState<string | null>(null);

  // تطبيق البارامترات القادمة من روابط خطة المراجعة أو الدروس
  useEffect(() => {
    const patch: Partial<ExamConfig> = {};
    const mode = params.get("mode");
    if (mode && mode in EXAM_PRESETS) {
      Object.assign(patch, EXAM_PRESETS[mode].config);
    }
    const topics = params.get("topics");
    if (topics) patch.topics = topics.split(",").filter((t) => ALL_TOPICS.includes(t as Topic)) as Topic[];
    const count = Number(params.get("count"));
    if (count > 0) patch.count = Math.min(60, count);
    const diff = params.get("difficulty");
    if (diff && ALL_DIFFICULTIES.includes(diff as Difficulty)) patch.difficulties = [diff as Difficulty];
    const lesson = params.get("lesson");
    if (lesson && LESSONS.some((l) => l.slug === lesson)) patch.lessonSlug = lesson;
    if (Object.keys(patch).length) setConfig((c) => ({ ...c, ...patch, mode: (patch.mode ?? "custom") as ExamConfig["mode"] }));
  }, [params]);

  const pool = useMemo(() => {
    if (config.mode === "mistakes") return Object.values(data.mistakes).filter((m) => !m.mastered).length;
    const topics = config.mode === "weakness" ? weakTopics(data, 3) : config.topics;
    return QUESTION_BANK.filter((q) => {
      if (topics.length && !topics.some((t) => q.topic === t || q.subtopics.includes(t))) return false;
      if (config.difficulties.length && !config.difficulties.includes(q.difficulty)) return false;
      if (config.lessonSlug && q.lessonSlug !== config.lessonSlug) return false;
      return true;
    }).length;
  }, [config, data]);

  const toggleTopic = (t: Topic) =>
    setConfig((c) => ({
      ...c,
      mode: "custom",
      topics: c.topics.includes(t) ? c.topics.filter((x) => x !== t) : [...c.topics, t],
    }));

  const toggleDiff = (d: Difficulty) =>
    setConfig((c) => ({
      ...c,
      difficulties: c.difficulties.includes(d) ? c.difficulties.filter((x) => x !== d) : [...c.difficulties, d],
    }));

  const applyPreset = (key: string) => {
    const p = EXAM_PRESETS[key];
    setConfig((c) => ({ ...c, ...p.config, topics: key === "weakness" ? [] : c.topics } as ExamConfig));
  };

  const start = () => {
    const questions = buildExam(data, config);
    if (!questions.length) {
      setError("لا توجد أسئلة مطابقة لهذه الإعدادات. وسّع المواضيع أو مستويات الصعوبة.");
      return;
    }
    const count = Math.min(config.count, questions.length);
    const id = `exam-${Date.now()}`;
    updateSettings(config);
    setActiveExam({
      id,
      title: titleFor(config, count),
      startedAt: Date.now(),
      qids: questions.slice(0, count).map((q) => q.id),
      answers: {},
      index: 0,
      config: { ...config, count },
      revealed: [],
    });
    router.push("/exam/run");
  };

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle title="إعداد الامتحان" subtitle="اختر جاهزًا، أو خصّص كل شيء بنفسك." />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(EXAM_PRESETS).map(([key, p]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className={`rounded-xl border p-3 text-right text-sm font-semibold transition ${
                config.mode === key ? "border-brand-400 bg-brand-50 text-brand-800" : "border-ink-200 bg-white hover:bg-ink-50"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      </Card>

      {data.activeExam && (
        <Callout tone="warn" title="يوجد امتحان غير مكتمل">
          بدء امتحان جديد سيحذف الامتحان الجاري غير المسلّم. يمكنك متابعته من الصفحة الرئيسية.
        </Callout>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title="الموضوعات" subtitle="بلا اختيار = كل الموضوعات." />
          <div className="grid gap-2 sm:grid-cols-2">
            {ALL_TOPICS.map((t) => {
              const on = config.topics.includes(t);
              const available = QUESTION_BANK.filter((q) => q.topic === t || q.subtopics.includes(t)).length;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTopic(t)}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-right text-sm transition ${
                    on ? "border-brand-400 bg-brand-50" : "border-ink-200 bg-white hover:bg-ink-50"
                  }`}
                >
                  <span className={/[֐-׿]/.test(TOPIC_LABEL[t]) ? "he" : ""}>{TOPIC_LABEL[t]}</span>
                  <span className="shrink-0 text-xs text-ink-400">{available}</span>
                </button>
              );
            })}
          </div>

          {config.lessonSlug && (
            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm">
              <span>
                مقيَّد بدرس: <strong>{lessonTitle(config.lessonSlug)}</strong>
              </span>
              <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={() => setConfig((c) => ({ ...c, lessonSlug: null }))}>
                إزالة التقييد
              </button>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle title="الإعدادات" />
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="count">
                عدد الأسئلة: {config.count}
              </label>
              <input
                id="count"
                type="range"
                min={5}
                max={60}
                step={1}
                value={config.count}
                onChange={(e) => setConfig((c) => ({ ...c, count: Number(e.target.value) }))}
                className="w-full accent-brand-600"
              />
              <p className="mt-1 text-xs text-ink-500">متاح بهذه الإعدادات: {pool} سؤالًا.</p>
            </div>

            <div>
              <span className="label">مستوى الصعوبة</span>
              <div className="flex flex-wrap gap-2">
                {ALL_DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDiff(d)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      config.difficulties.includes(d) ? "border-brand-400 bg-brand-50" : "border-ink-200 bg-white"
                    }`}
                  >
                    {DIFFICULTY_LABEL[d]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label">المؤقت</span>
              <div className="flex flex-wrap gap-2">
                {[null, 10, 20, 30, 50].map((m) => (
                  <button
                    key={String(m)}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, timerMinutes: m }))}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      config.timerMinutes === m ? "border-brand-400 bg-brand-50" : "border-ink-200 bg-white"
                    }`}
                  >
                    {m === null ? "بلا مؤقت" : `${m} دقيقة`}
                  </button>
                ))}
              </div>
            </div>

            <Toggle
              label="إظهار التلميحات أثناء الحل"
              checked={config.showHints}
              onChange={(v) => setConfig((c) => ({ ...c, showHints: v }))}
            />
            <Toggle
              label="تصحيح فوري بعد كل سؤال"
              hint="إن أوقفته لن ترى الإجابة الصحيحة إلا بعد تسليم الامتحان."
              checked={config.instantFeedback}
              onChange={(v) => setConfig((c) => ({ ...c, instantFeedback: v }))}
            />
          </div>
        </Card>
      </div>

      {error && <Callout tone="warn" title="تعذّر بدء الامتحان">{error}</Callout>}

      <Card className="sticky bottom-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 text-xs">
            <Chip tone="info">{Math.min(config.count, pool)} سؤالًا</Chip>
            <Chip>{config.topics.length ? `${config.topics.length} موضوعات` : "كل الموضوعات"}</Chip>
            <Chip>{config.difficulties.length ? config.difficulties.map((d) => DIFFICULTY_LABEL[d]).join("، ") : "كل المستويات"}</Chip>
            <Chip>{config.timerMinutes ? `${config.timerMinutes} دقيقة` : "بلا مؤقت"}</Chip>
            <Chip>{config.instantFeedback ? "تصحيح فوري" : "تصحيح في النهاية"}</Chip>
          </div>
          <button type="button" className="btn-primary px-6" onClick={start} disabled={pool === 0}>
            ابدأ الامتحان ←
          </button>
        </div>
      </Card>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
      />
      <span>
        <span className="block text-sm font-medium text-ink-800">{label}</span>
        {hint && <span className="block text-xs text-ink-500">{hint}</span>}
      </span>
    </label>
  );
}

function titleFor(config: ExamConfig, count: number): string {
  if (config.mode === "mistakes") return `مراجعة الأخطاء — ${count} أسئلة`;
  if (config.mode === "weakness") return `امتحان نقاط الضعف — ${count} أسئلة`;
  if (config.lessonSlug) return `تدريب على ${lessonTitle(config.lessonSlug)} — ${count} أسئلة`;
  if (config.mode === "quick") return `امتحان سريع — ${count} أسئلة`;
  if (config.mode === "practice") return `امتحان تدريبي — ${count} أسئلة`;
  if (config.mode === "full") return `امتحان شامل — ${count} أسئلة`;
  return `امتحان مخصص — ${count} أسئلة`;
}
