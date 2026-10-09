"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  type ActiveExam,
  type AnswerRecord,
  type AppData,
  type ExamConfig,
  type ExamRecord,
  emptyData,
  loadData,
  nextReviewTime,
  saveData,
} from "@/lib/storage";
import type { Question } from "@/lib/types";
import { gradeQuestion } from "@/lib/scoring";

interface Ctx {
  data: AppData;
  ready: boolean;
  recordAnswers: (
    entries: { question: Question; given: string | Record<string, string> | null }[],
    examId?: string,
  ) => void;
  saveExam: (exam: ExamRecord) => void;
  setActiveExam: (exam: ActiveExam | null) => void;
  updateSettings: (patch: Partial<ExamConfig>) => void;
  markLesson: (slug: string, done: boolean) => void;
  setLastLesson: (slug: string) => void;
  replaceData: (next: AppData) => void;
  resetData: () => void;
}

const AppDataContext = createContext<Ctx | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const firstLoad = useRef(true);

  useEffect(() => {
    setData(loadData());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    saveData(data);
  }, [data, ready]);

  const recordAnswers = useCallback<Ctx["recordAnswers"]>((entries, examId) => {
    setData((prev) => {
      const next: AppData = { ...prev, answers: [...prev.answers], mistakes: { ...prev.mistakes } };
      const now = Date.now();
      for (const { question, given } of entries) {
        const g = gradeQuestion(question, given);
        const rec: AnswerRecord = {
          qid: question.id,
          topic: question.topic,
          subtopics: question.subtopics ?? [],
          difficulty: question.difficulty,
          ruleId: question.ruleId,
          earned: g.earned,
          total: g.total,
          correct: g.correct,
          at: now,
          examId,
        };
        next.answers.push(rec);

        const existing = next.mistakes[question.id];
        if (!g.correct) {
          const timesWrong = (existing?.timesWrong ?? 0) + 1;
          next.mistakes[question.id] = {
            qid: question.id,
            topic: question.topic,
            timesWrong,
            timesRight: existing?.timesRight ?? 0,
            lastWrongAt: now,
            lastAnswer: typeof given === "string" ? given : JSON.stringify(given ?? ""),
            box: 0,
            // صندوق 0 ⇒ فاصل صفر: السؤال الذي أخطأ فيه الطالب مستحقّ للمراجعة فورًا
            nextReviewAt: nextReviewTime(0, now),
            mastered: false,
          };
        } else if (existing) {
          const timesRight = existing.timesRight + 1;
          const box = Math.min(existing.box + 1, 5);
          next.mistakes[question.id] = {
            ...existing,
            timesRight,
            box,
            nextReviewAt: nextReviewTime(box, now),
            // يُعدّ متمكنًا بعد ثلاث إجابات صحيحة متتالية في المراجعة
            mastered: timesRight >= 3,
          };
        }
      }
      return next;
    });
  }, []);

  const saveExam = useCallback<Ctx["saveExam"]>((exam) => {
    setData((prev) => ({ ...prev, exams: [...prev.exams, exam], activeExam: null }));
  }, []);

  const setActiveExam = useCallback<Ctx["setActiveExam"]>((exam) => {
    setData((prev) => ({ ...prev, activeExam: exam }));
  }, []);

  const updateSettings = useCallback<Ctx["updateSettings"]>((patch) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const markLesson = useCallback<Ctx["markLesson"]>((slug, done) => {
    setData((prev) => {
      const set = new Set(prev.lessonsCompleted);
      if (done) set.add(slug);
      else set.delete(slug);
      return { ...prev, lessonsCompleted: [...set] };
    });
  }, []);

  const setLastLesson = useCallback<Ctx["setLastLesson"]>((slug) => {
    setData((prev) => (prev.lastLesson === slug ? prev : { ...prev, lastLesson: slug }));
  }, []);

  const replaceData = useCallback<Ctx["replaceData"]>((next) => setData(next), []);
  const resetData = useCallback(() => setData(emptyData()), []);

  const value = useMemo<Ctx>(
    () => ({
      data,
      ready,
      recordAnswers,
      saveExam,
      setActiveExam,
      updateSettings,
      markLesson,
      setLastLesson,
      replaceData,
      resetData,
    }),
    [data, ready, recordAnswers, saveExam, setActiveExam, updateSettings, markLesson, setLastLesson, replaceData, resetData],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): Ctx {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData يجب أن يُستخدم داخل AppDataProvider");
  return ctx;
}
