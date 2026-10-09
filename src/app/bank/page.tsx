"use client";

import { useMemo, useState } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import { Card, Chip, SectionTitle, StatCard } from "@/components/ui";
import {
  ALL_DIFFICULTIES,
  ALL_TOPICS,
  DIFFICULTY_LABEL,
  QUESTION_BANK,
  TOPIC_SHORT,
  TYPE_LABEL,
  statsByDifficulty,
  statsByType,
} from "@/data/questionBank";
import { BINYAN_LABEL, BINYAN_ORDER } from "@/data/binyanim";
import { VERB_DATA } from "@/data/verbs";
import type { Binyan, Difficulty, QuestionType, Topic } from "@/lib/types";

const PAGE = 12;

export default function BankPage() {
  const [topic, setTopic] = useState<Topic | "">("");
  const [diff, setDiff] = useState<Difficulty | "">("");
  const [type, setType] = useState<QuestionType | "">("");
  const [binyan, setBinyan] = useState<Binyan | "">("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string | Record<string, string> | null>>({});

  const byDiff = statsByDifficulty();
  const byType = statsByType();

  const filtered = useMemo(() => {
    const q = query.trim();
    return QUESTION_BANK.filter((item) => {
      if (topic && item.topic !== topic && !item.subtopics.includes(topic)) return false;
      if (diff && item.difficulty !== diff) return false;
      if (type && item.type !== type) return false;
      if (binyan && item.binyan !== binyan) return false;
      if (q && !(item.prompt.includes(q) || (item.hebrew ?? "").includes(q) || (item.root ?? "").includes(q))) return false;
      return true;
    });
  }, [topic, diff, type, binyan, query]);

  const shown = filtered.slice(0, (page + 1) * PAGE);

  const reset = () => {
    setTopic("");
    setDiff("");
    setType("");
    setBinyan("");
    setQuery("");
    setPage(0);
  };

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle
          title="بنك الأسئلة"
          subtitle="كل الأسئلة منظّمة حسب الموضوع والبنيان والنوع ومستوى الصعوبة، مع شرح لكل إجابة."
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="مجموع الأسئلة" value={QUESTION_BANK.length} />
          <StatCard label="أفعال مدققة في القاعدة" value={VERB_DATA.length} hint="هي مصدر كل الأسئلة المولّدة" />
          <StatCard label="أنواع الأسئلة" value={Object.keys(byType).length} />
          <StatCard label="صعب + صعب جدًا" value={byDiff.hard + byDiff.expert} />
        </div>
      </Card>

      <Card>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label" htmlFor="f-topic">الموضوع</label>
            <select id="f-topic" className="input" value={topic} onChange={(e) => { setTopic(e.target.value as Topic | ""); setPage(0); }}>
              <option value="">كل الموضوعات</option>
              {ALL_TOPICS.map((t) => (
                <option key={t} value={t}>{TOPIC_SHORT[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-diff">الصعوبة</label>
            <select id="f-diff" className="input" value={diff} onChange={(e) => { setDiff(e.target.value as Difficulty | ""); setPage(0); }}>
              <option value="">كل المستويات</option>
              {ALL_DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABEL[d]} ({byDiff[d]})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-type">نوع السؤال</label>
            <select id="f-type" className="input" value={type} onChange={(e) => { setType(e.target.value as QuestionType | ""); setPage(0); }}>
              <option value="">كل الأنواع</option>
              {Object.keys(byType).map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t as QuestionType]} ({byType[t]})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-binyan">البنيان</label>
            <select id="f-binyan" className="input" value={binyan} onChange={(e) => { setBinyan(e.target.value as Binyan | ""); setPage(0); }}>
              <option value="">كل الأوزان</option>
              {BINYAN_ORDER.map((b) => (
                <option key={b} value={b}>{BINYAN_LABEL[b]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-q">بحث (عبري أو عربي)</label>
            <input id="f-q" className="input" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="مثال: הודלק أو כ.ת.ב" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Chip tone="info">النتائج: {filtered.length}</Chip>
          <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={reset}>
            إعادة ضبط الفلاتر
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        {shown.map((q) => (
          <div key={q.id}>
            <QuestionCard
              question={q}
              value={answers[q.id] ?? null}
              onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
              revealed={!!revealed[q.id]}
              showHints
            />
            {!revealed[q.id] && (
              <div className="mt-2">
                <button
                  type="button"
                  className="btn-soft"
                  onClick={() => setRevealed((r) => ({ ...r, [q.id]: true }))}
                >
                  إظهار الحل والشرح
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {shown.length < filtered.length && (
        <button type="button" className="btn-ghost w-full" onClick={() => setPage((p) => p + 1)}>
          عرض {Math.min(PAGE, filtered.length - shown.length)} سؤالًا إضافيًا
        </button>
      )}
      {filtered.length === 0 && (
        <Card>
          <p className="text-sm text-ink-500">لا توجد أسئلة مطابقة. جرّب تخفيف الفلاتر.</p>
        </Card>
      )}
    </div>
  );
}
