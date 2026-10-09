/** تطبيع نص الإجابات الكتابية حتى لا يُحسب الفرق الشكلي خطأً. */

const NIQQUD = /[֑-ׇ]/g;

export function normalizeAnswer(input: string): string {
  return input
    .replace(NIQQUD, "")
    .replace(/[.\-–—_'"`׳״]/g, "")
    .replace(/\s+/g, "")
    .replace(/[أإآ]/g, "ا")
    .trim()
    .toLowerCase();
}

export function answerMatches(given: string, answer: string, accepted: string[] = []): boolean {
  const g = normalizeAnswer(given);
  if (!g) return false;
  return [answer, ...accepted].some((a) => normalizeAnswer(a) === g);
}

/** مولّد أرقام شبه عشوائي ثابت لنفس المُدخل — حتى يبقى ترتيب الخيارات ثابتًا. */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: T[], seed: string): T[] {
  const rnd = seededRandom(seed);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
