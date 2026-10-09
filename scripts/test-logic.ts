/**
 * اختبارات منطق التصحيح والاختيار والمراجعة المتباعدة.
 * التشغيل: npm run test:logic
 */
import assert from "node:assert/strict";
import { QUESTION_BANK, QUESTION_BY_ID } from "../src/data/questionBank";
import { gradeQuestion, percent } from "../src/lib/scoring";
import { answerMatches, normalizeAnswer, seededShuffle } from "../src/lib/normalize";
import { buildExam, buildMistakeExam } from "../src/lib/selection";
import { emptyData, nextReviewTime, migrate, importData, exportData, type AppData } from "../src/lib/storage";
import { overview, topicStats } from "../src/lib/analysis";
import type { Question } from "../src/lib/types";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log("  ✓ " + name);
}

const byType = (t: Question["type"]) => QUESTION_BANK.find((q) => q.type === t)!;

console.log("التصحيح:");
test("سؤال اختيار: الإجابة الصحيحة تعطي نقطة كاملة", () => {
  const q = byType("mcq");
  const g = gradeQuestion(q, q.answer!);
  assert.deepEqual(g, { earned: 1, total: 1, correct: true });
});
test("سؤال اختيار: الإجابة الخاطئة تعطي صفرًا", () => {
  const q = byType("mcq");
  const wrong = q.options!.find((o) => o !== q.answer)!;
  assert.deepEqual(gradeQuestion(q, wrong), { earned: 0, total: 1, correct: false });
});
test("عدم الإجابة يعطي صفرًا ولا يُحسب صحيحًا", () => {
  const q = byType("mcq");
  assert.deepEqual(gradeQuestion(q, null), { earned: 0, total: 1, correct: false });
});
test("سؤال كتابي: التطبيع يقبل الجذر بالنقاط وبدونها", () => {
  const q = QUESTION_BANK.find((x) => x.type === "write-root")!;
  assert.equal(gradeQuestion(q, q.answer!).correct, true);
  assert.equal(gradeQuestion(q, q.answer!.replace(/\./g, "")).correct, true);
  assert.equal(gradeQuestion(q, q.answer!.split(".").join("-")).correct, true);
  assert.equal(gradeQuestion(q, "כ.ל.ב").correct, false);
});
test("سؤال متعدد الحقول: الإجابة الناقصة لا تُحسب صحيحة بالكامل", () => {
  const q = QUESTION_BANK.find((x) => (x.fields?.length ?? 0) >= 3)!;
  const partial: Record<string, string> = {};
  partial[q.fields![0].key] = q.fields![0].answer;
  const g = gradeQuestion(q, partial);
  assert.equal(g.earned, 1);
  assert.equal(g.total, q.fields!.length);
  assert.equal(g.correct, false);
});
test("سؤال متعدد الحقول: كل الحقول صحيحة ⇒ صحيح بالكامل", () => {
  const q = QUESTION_BANK.find((x) => (x.fields?.length ?? 0) >= 3)!;
  const full: Record<string, string> = {};
  for (const f of q.fields!) full[f.key] = f.answer;
  const g = gradeQuestion(q, full);
  assert.equal(g.correct, true);
  assert.equal(g.earned, g.total);
});
test("حساب النسبة من 100 ثابت", () => {
  assert.equal(percent(0, 10), 0);
  assert.equal(percent(5, 10), 50);
  assert.equal(percent(10, 10), 100);
  assert.equal(percent(0, 0), 0);
});
test("التطبيع يحذف الحركات والمسافات", () => {
  assert.equal(normalizeAnswer(" נִכְתַּב "), normalizeAnswer("נכתב"));
  assert.equal(answerMatches("  פיעל ", "פיעל", []), true);
  assert.equal(answerMatches("", "פיעל", []), false);
});

console.log("\nالاختيار وبناء الامتحان:");
test("الترتيب الحتمي: نفس المفتاح يعطي نفس الترتيب", () => {
  const a = seededShuffle([1, 2, 3, 4, 5, 6], "k");
  const b = seededShuffle([1, 2, 3, 4, 5, 6], "k");
  assert.deepEqual(a, b);
  assert.notDeepEqual(seededShuffle([1, 2, 3, 4, 5, 6], "k2"), a);
});
test("بناء امتحان بالعدد المطلوب وبلا تكرار", () => {
  const data = emptyData();
  const qs = buildExam(data, { ...data.settings, count: 40, mode: "full" }, "seed-1");
  assert.equal(qs.length, 40);
  assert.equal(new Set(qs.map((q) => q.id)).size, 40);
});
test("تقييد الموضوع يُحترم", () => {
  const data = emptyData();
  const qs = buildExam(data, { ...data.settings, count: 15, topics: ["voice"], mode: "custom" }, "s2");
  assert.equal(qs.length, 15);
  assert.ok(qs.every((q) => q.topic === "voice" || q.subtopics.includes("voice")));
});
test("تقييد الصعوبة يُحترم", () => {
  const data = emptyData();
  const qs = buildExam(data, { ...data.settings, count: 12, difficulties: ["expert"], mode: "custom" }, "s3");
  assert.ok(qs.length > 0);
  assert.ok(qs.every((q) => q.difficulty === "expert"));
});
test("لا يعيد الأسئلة المحلولة حديثًا ما دام البنك يكفي", () => {
  const data = emptyData();
  const first = buildExam(data, { ...data.settings, count: 20, mode: "practice" }, "s4");
  data.answers = first.map((q) => ({
    qid: q.id,
    topic: q.topic,
    subtopics: q.subtopics,
    difficulty: q.difficulty,
    ruleId: q.ruleId,
    earned: 1,
    total: 1,
    correct: true,
    at: Date.now(),
  }));
  const second = buildExam(data, { ...data.settings, count: 20, mode: "practice" }, "s5");
  const overlap = second.filter((q) => first.some((f) => f.id === q.id));
  assert.equal(overlap.length, 0);
});
test("امتحان نقاط الضعف يختار المواضيع الأضعف", () => {
  const data = emptyData();
  const now = Date.now();
  const voiceQs = QUESTION_BANK.filter((q) => q.topic === "voice").slice(0, 12);
  data.answers = voiceQs.map((q, i) => ({
    qid: q.id,
    topic: q.topic,
    subtopics: q.subtopics,
    difficulty: q.difficulty,
    ruleId: q.ruleId,
    earned: 0,
    total: 1,
    correct: false,
    at: now - i * 1000,
  }));
  const stats = topicStats(data);
  assert.equal(stats[0].status, "weak");
  const qs = buildExam(data, { ...data.settings, count: 10, mode: "weakness" }, "s6");
  assert.ok(qs.length > 0);
});
test("التصنيف لا يحكم بالضعف من خطأ واحد", () => {
  const data = emptyData();
  const q = QUESTION_BANK.find((x) => x.topic === "root")!;
  data.answers = [
    { qid: q.id, topic: "root", subtopics: q.subtopics, difficulty: q.difficulty, ruleId: q.ruleId, earned: 0, total: 1, correct: false, at: Date.now() },
  ];
  const root = topicStats(data).find((s) => s.topic === "root")!;
  assert.equal(root.status, "low-data");
  assert.ok(root.confidence < 0.2);
});

console.log("\nدفتر الأخطاء والمراجعة المتباعدة:");
test("فترات المراجعة تتزايد", () => {
  const base = 1_700_000_000_000;
  const d1 = nextReviewTime(1, base);
  const d3 = nextReviewTime(3, base);
  const d5 = nextReviewTime(5, base);
  assert.ok(d1 < d3 && d3 < d5);
  assert.equal((d1 - base) / 86_400_000, 1);
  assert.equal((d5 - base) / 86_400_000, 35);
});
test("امتحان الأخطاء يبدأ بالمستحقّ للمراجعة", () => {
  const data = emptyData();
  const [a, b] = QUESTION_BANK;
  const now = Date.now();
  data.mistakes = {
    [a.id]: { qid: a.id, topic: a.topic, timesWrong: 1, timesRight: 0, lastWrongAt: now, lastAnswer: "", box: 2, nextReviewAt: now + 86_400_000, mastered: false },
    [b.id]: { qid: b.id, topic: b.topic, timesWrong: 3, timesRight: 0, lastWrongAt: now, lastAnswer: "", box: 0, nextReviewAt: now - 1000, mastered: false },
  };
  const qs = buildMistakeExam(data, 5);
  assert.equal(qs[0].id, b.id);
  assert.equal(qs.length, 2);
});
test("الأسئلة المتمكَّنة تُستثنى من المراجعة", () => {
  const data = emptyData();
  const a = QUESTION_BANK[0];
  data.mistakes = {
    [a.id]: { qid: a.id, topic: a.topic, timesWrong: 1, timesRight: 3, lastWrongAt: 0, lastAnswer: "", box: 5, nextReviewAt: 0, mastered: true },
  };
  assert.equal(buildMistakeExam(data, 5).length, 0);
});

console.log("\nالتخزين والنسخ الاحتياطي:");
test("الترقية تتعامل مع بيانات تالفة بلا انهيار", () => {
  assert.equal(migrate(null).version, 1);
  assert.equal(migrate({ answers: "ليست مصفوفة" }).answers.length, 0);
  assert.equal(migrate({ answers: [{ bad: true }] }).answers.length, 0);
});
test("التصدير والاستيراد يحافظان على البيانات", () => {
  const data: AppData = emptyData();
  const q = QUESTION_BANK[0];
  data.answers.push({ qid: q.id, topic: q.topic, subtopics: q.subtopics, difficulty: q.difficulty, ruleId: q.ruleId, earned: 1, total: 1, correct: true, at: 123 });
  data.lessonsCompleted.push("binyan-paal");
  const round = importData(exportData(data))!;
  assert.equal(round.answers.length, 1);
  assert.equal(round.answers[0].qid, q.id);
  assert.deepEqual(round.lessonsCompleted, ["binyan-paal"]);
  assert.equal(importData("نص غير صالح"), null);
});
test("الملخص العام يحسب المتوسط والنسبة", () => {
  const data = emptyData();
  data.exams = [
    { id: "e1", title: "t", startedAt: 0, finishedAt: 10, durationMs: 10, scorePercent: 60, earned: 6, total: 10, correctCount: 6, wrongCount: 4, items: [], config: data.settings },
    { id: "e2", title: "t", startedAt: 0, finishedAt: 20, durationMs: 10, scorePercent: 80, earned: 8, total: 10, correctCount: 8, wrongCount: 2, items: [], config: data.settings },
  ];
  const ov = overview(data);
  assert.equal(ov.lastScore, 80);
  assert.equal(ov.avgScore, 70);
  assert.equal(ov.examsCount, 2);
});

console.log("\nسلامة البنك:");
test("كل سؤال له درس موجود ومعرّف فريد", () => {
  assert.equal(QUESTION_BY_ID.size, QUESTION_BANK.length);
  for (const q of QUESTION_BANK) {
    assert.ok(q.lessonSlug.length > 0, q.id);
  }
});
test("كل الأنواع الأربعة عشر موجودة في البنك", () => {
  const types = new Set(QUESTION_BANK.map((q) => q.type));
  assert.equal(types.size, 14);
});

console.log(`\n✓ نجحت ${passed} حالة اختبار.`);
