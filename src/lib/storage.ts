"use client";

import type { Difficulty, Topic } from "./types";

export const DATA_VERSION = 1;
export const STORAGE_KEY = "hebrew-grammar-exam:v1";

export interface AnswerRecord {
  qid: string;
  topic: Topic;
  subtopics: Topic[];
  difficulty: Difficulty;
  ruleId: string;
  /** عدد الوحدات المحقونة من أصل total (للأسئلة متعددة الحقول). */
  earned: number;
  total: number;
  correct: boolean; // صحيح بالكامل فقط
  at: number;
  examId?: string;
}

export interface ExamItem {
  qid: string;
  given: string | Record<string, string> | null;
  earned: number;
  total: number;
  correct: boolean;
}

export interface ExamRecord {
  id: string;
  title: string;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  scorePercent: number;
  earned: number;
  total: number;
  correctCount: number;
  wrongCount: number;
  items: ExamItem[];
  config: ExamConfig;
}

export interface MistakeRecord {
  qid: string;
  topic: Topic;
  timesWrong: number;
  timesRight: number;
  lastWrongAt: number;
  lastAnswer: string;
  box: number; // صندوق المراجعة المتباعدة 0..5
  nextReviewAt: number;
  mastered: boolean;
}

export interface ExamConfig {
  count: number;
  topics: Topic[];
  difficulties: Difficulty[];
  showHints: boolean;
  /** تصحيح فوري بعد كل سؤال، أو في النهاية فقط. */
  instantFeedback: boolean;
  timerMinutes: number | null;
  mode: "quick" | "practice" | "full" | "custom" | "weakness" | "mistakes";
  /** تقييد الأسئلة بدرس معيّن (اختياري). */
  lessonSlug?: string | null;
}

export interface ActiveExam {
  id: string;
  title: string;
  startedAt: number;
  qids: string[];
  answers: Record<string, string | Record<string, string>>;
  index: number;
  config: ExamConfig;
  revealed: string[];
}

export interface AppData {
  version: number;
  createdAt: number;
  updatedAt: number;
  answers: AnswerRecord[];
  exams: ExamRecord[];
  mistakes: Record<string, MistakeRecord>;
  lessonsCompleted: string[];
  lastLesson: string | null;
  settings: ExamConfig;
  activeExam: ActiveExam | null;
}

export const DEFAULT_CONFIG: ExamConfig = {
  count: 10,
  topics: [],
  difficulties: [],
  showHints: true,
  instantFeedback: false,
  timerMinutes: null,
  mode: "quick",
  lessonSlug: null,
};

export function emptyData(): AppData {
  const now = Date.now();
  return {
    version: DATA_VERSION,
    createdAt: now,
    updatedAt: now,
    answers: [],
    exams: [],
    mistakes: {},
    lessonsCompleted: [],
    lastLesson: null,
    settings: { ...DEFAULT_CONFIG },
    activeExam: null,
  };
}

/** تحقق من صحة البنية مع ترقية الإصدارات القديمة عند الحاجة. */
export function migrate(raw: unknown): AppData {
  if (!raw || typeof raw !== "object") return emptyData();
  const d = raw as Partial<AppData>;
  const base = emptyData();
  const data: AppData = {
    ...base,
    ...d,
    version: DATA_VERSION,
    answers: Array.isArray(d.answers) ? d.answers.filter(isAnswer) : [],
    exams: Array.isArray(d.exams) ? d.exams.filter(isExam) : [],
    mistakes: d.mistakes && typeof d.mistakes === "object" ? (d.mistakes as AppData["mistakes"]) : {},
    lessonsCompleted: Array.isArray(d.lessonsCompleted) ? d.lessonsCompleted.filter((x) => typeof x === "string") : [],
    lastLesson: typeof d.lastLesson === "string" ? d.lastLesson : null,
    settings: { ...DEFAULT_CONFIG, ...(d.settings ?? {}) },
    activeExam: d.activeExam && typeof d.activeExam === "object" ? (d.activeExam as ActiveExam) : null,
  };
  return data;
}

function isAnswer(a: unknown): a is AnswerRecord {
  const x = a as AnswerRecord;
  return !!x && typeof x.qid === "string" && typeof x.at === "number" && typeof x.total === "number";
}
function isExam(a: unknown): a is ExamRecord {
  const x = a as ExamRecord;
  return !!x && typeof x.id === "string" && Array.isArray(x.items);
}

export function loadData(): AppData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return migrate(JSON.parse(raw));
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    data.updatedAt = Date.now();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // قد تكون المساحة ممتلئة أو الوضع الخاص مفعّلًا — نتجاهل بهدوء
  }
}

export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importData(text: string): AppData | null {
  try {
    const parsed = JSON.parse(text);
    return migrate(parsed);
  } catch {
    return null;
  }
}

/** فترات المراجعة المتباعدة بالأيام لكل صندوق. */
export const SRS_INTERVALS_DAYS = [0, 1, 3, 7, 16, 35];

export function nextReviewTime(box: number, from = Date.now()): number {
  const b = Math.max(0, Math.min(box, SRS_INTERVALS_DAYS.length - 1));
  return from + SRS_INTERVALS_DAYS[b] * 24 * 60 * 60 * 1000;
}
