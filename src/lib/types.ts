/** أنواع البيانات الأساسية للمشروع. */

export type Binyan =
  | "paal"
  | "nifal"
  | "piel"
  | "pual"
  | "hifil"
  | "hufal"
  | "hitpael";

export type Tense = "past" | "present" | "future" | "imperative" | "infinitive";

export type Voice = "active" | "passive" | "middle";
/** active = פעיל، passive = סביל، middle = لا معلوم ولا مجهول (انعكاسي/متبادل/لازم). */

export type Topic =
  | "binyanim"          // التعرّف على البنيان
  | "root"              // الجذر
  | "tense"             // الزمن
  | "voice"             // פעיל / סביל
  | "conjugation"       // التصريف
  | "sentence-analysis" // تحليل الفعل في الجملة
  | "pairs"             // أزواج معلوم/مجهول وأوزان متشابهة
  | "error-correction"; // تصحيح الأخطاء

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export type QuestionType =
  | "mcq"            // اختيار من متعدد (إجابة واحدة)
  | "true-false"     // صح / خطأ
  | "write-binyan"   // كتابة اسم البنيان
  | "write-root"     // كتابة الجذر
  | "write-tense"    // كتابة الزمن
  | "voice-pick"     // פעיל أو סביל
  | "fill-blank"     // إكمال جملة باختيار الفعل
  | "transform"      // تحويل פעיל <-> סביל (إجابة كتابية)
  | "fix-error"      // تصحيح فعل خاطئ (إجابة كتابية)
  | "match"          // مطابقة فعل مع بنيان
  | "analyze"        // تحليل فعل في سياق (اختيار متعدد الحقول)
  | "distinguish"    // التمييز بين بنيانين متشابهين
  | "open-write"     // كتابة حرة مدققة بقائمة إجابات مقبولة
  | "multi-skill";   // سؤال يجمع أكثر من مهارة

/** حقل واحد في سؤال التحليل أو السؤال المركّب. */
export interface AnalyzeField {
  key: string;
  label: string;         // عربي
  options: string[];
  answer: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  topic: Topic;
  subtopics: Topic[];
  difficulty: Difficulty;
  /** نص السؤال بالعربية (قد يحتوي كلمات عبرية بين علامات). */
  prompt: string;
  /** المقطع العبري المعروض بشكل منفصل بخط عبري و LTR. */
  hebrew?: string;
  options?: string[];
  /** الإجابة الصحيحة: فهرس للاختيار، أو نص للكتابة. */
  answer?: string;
  /** صيغ أخرى مقبولة في أسئلة الكتابة (بعد التطبيع). */
  acceptedAnswers?: string[];
  /** حقول متعددة لأسئلة analyze / multi-skill. */
  fields?: AnalyzeField[];
  explanation: string;  // شرح عربي لسبب صحة الإجابة
  hint: string;         // تلميح قبل الحل
  ruleId: string;       // القاعدة المرتبطة
  lessonSlug: string;   // الدرس المرتبط
  binyan?: Binyan;
  tense?: Tense;
  root?: string;
  tags?: string[];
}

export interface VerbEntry {
  root: string;            // بالعبرية مع نقاط فاصلة: כ.ת.ב
  rootLetters: string[];
  binyan: Binyan;
  voice: Voice;
  past3ms: string;
  present3ms: string;
  future3ms: string;
  imperative?: string;     // لا يوجد في פועל و הופעל
  infinitive?: string;
  meaningAr: string;
  /** شريك الوزن: فعل بنفس الجذر في وزن آخر (للمقارنة والمجهول). */
  activeCounterpart?: string;  // للمجهول: الفعل المعلوم المقابل
  notes?: string;
  /** صيغ جذر إضافية مقبولة في أسئلة الكتابة (للأفعال التي تتعدد فيها كتابة الجذر في الكتب المدرسية). */
  rootAccept?: string[];
  gizra?: "shlemim" | "nahei-lamed-he" | "ayin-vav" | "pei-nun" | "other";
}
