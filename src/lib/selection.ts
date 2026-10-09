import { QUESTION_BANK } from "@/data/questionBank";
import { seededShuffle } from "./normalize";
import { topicStats } from "./analysis";
import type { AppData, ExamConfig } from "./storage";
import type { Question, Topic } from "./types";

/** عدد آخر الأسئلة التي نحاول عدم تكرارها. */
const RECENT_WINDOW = 120;

function recentlySeen(data: AppData): Set<string> {
  const sorted = [...data.answers].sort((a, b) => b.at - a.at).slice(0, RECENT_WINDOW);
  return new Set(sorted.map((a) => a.qid));
}

function matchesConfig(q: Question, config: ExamConfig): boolean {
  if (config.topics.length && !config.topics.some((t) => q.topic === t || q.subtopics.includes(t))) {
    return false;
  }
  if (config.difficulties.length && !config.difficulties.includes(q.difficulty)) return false;
  if (config.lessonSlug && q.lessonSlug !== config.lessonSlug) return false;
  return true;
}

/** توزيع متوازن على المواضيع المختارة مع تنويع أنواع الأسئلة. */
function balance(pool: Question[], count: number, seed: string): Question[] {
  const byTopic = new Map<Topic, Question[]>();
  for (const q of pool) {
    const list = byTopic.get(q.topic) ?? [];
    list.push(q);
    byTopic.set(q.topic, list);
  }
  const buckets = [...byTopic.entries()].map(([t, list]) => ({
    topic: t,
    list: seededShuffle(list, seed + t),
  }));
  const out: Question[] = [];
  const usedTypes = new Map<string, number>();
  let guard = 0;
  while (out.length < count && buckets.some((b) => b.list.length) && guard < count * 40) {
    guard += 1;
    for (const b of buckets) {
      if (out.length >= count) break;
      // نفضّل نوعًا لم يتكرر كثيرًا
      let pickIndex = b.list.findIndex(
        (q) => (usedTypes.get(q.type) ?? 0) < Math.max(2, Math.ceil(count / 5)),
      );
      if (pickIndex === -1) pickIndex = 0;
      const q = b.list.splice(pickIndex, 1)[0];
      if (!q) continue;
      out.push(q);
      usedTypes.set(q.type, (usedTypes.get(q.type) ?? 0) + 1);
    }
  }
  return out.slice(0, count);
}

export function buildExam(data: AppData, config: ExamConfig, seed = String(Date.now())): Question[] {
  if (config.mode === "mistakes") return buildMistakeExam(data, config.count);
  const effective: ExamConfig =
    config.mode === "weakness" ? { ...config, topics: weakTopics(data, 3) } : config;

  const all = QUESTION_BANK.filter((q) => matchesConfig(q, effective));
  if (!all.length) return [];
  const recent = recentlySeen(data);
  const fresh = all.filter((q) => !recent.has(q.id));
  const primary = balance(fresh, effective.count, seed);
  if (primary.length >= effective.count) return primary;
  // إذا لم تكفِ الأسئلة الجديدة نكمل من المحلولة سابقًا، والأقدم أولًا
  const lastSeen = new Map<string, number>();
  for (const a of data.answers) lastSeen.set(a.qid, Math.max(lastSeen.get(a.qid) ?? 0, a.at));
  const rest = all
    .filter((q) => !primary.some((p) => p.id === q.id))
    .sort((a, b) => (lastSeen.get(a.id) ?? 0) - (lastSeen.get(b.id) ?? 0));
  return [...primary, ...rest].slice(0, effective.count);
}

export function weakTopics(data: AppData, n = 3): Topic[] {
  const stats = topicStats(data).filter((s) => s.status === "weak" || s.status === "ok");
  if (!stats.length) return topicStats(data).slice(0, n).map((s) => s.topic);
  return stats.slice(0, n).map((s) => s.topic);
}

/** أسئلة دفتر الأخطاء، والمستحقّة للمراجعة أولًا. */
export function buildMistakeExam(data: AppData, count: number): Question[] {
  const now = Date.now();
  const entries = Object.values(data.mistakes).filter((m) => !m.mastered);
  const due = entries.filter((m) => m.nextReviewAt <= now);
  const later = entries.filter((m) => m.nextReviewAt > now);
  const ordered = [
    ...due.sort((a, b) => b.timesWrong - a.timesWrong || a.nextReviewAt - b.nextReviewAt),
    ...later.sort((a, b) => a.nextReviewAt - b.nextReviewAt),
  ];
  const out: Question[] = [];
  for (const m of ordered) {
    const q = QUESTION_BANK.find((x) => x.id === m.qid);
    if (q) out.push(q);
    if (out.length >= count) break;
  }
  return out;
}

export const EXAM_PRESETS: Record<string, { title: string; config: Partial<ExamConfig> }> = {
  quick: { title: "امتحان سريع — 10 أسئلة", config: { count: 10, mode: "quick", timerMinutes: 10 } },
  practice: { title: "امتحان تدريبي — 20 سؤالًا", config: { count: 20, mode: "practice", timerMinutes: 25 } },
  full: { title: "امتحان شامل — 40 سؤالًا", config: { count: 40, mode: "full", timerMinutes: 50 } },
  weakness: { title: "امتحان نقاط الضعف", config: { count: 15, mode: "weakness", timerMinutes: null } },
  mistakes: { title: "مراجعة أخطائي", config: { count: 15, mode: "mistakes", timerMinutes: null } },
};
