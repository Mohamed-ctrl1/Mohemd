import type { VerbEntry } from "@/lib/types";

/**
 * قاعدة أفعال مدققة. كل صيغة هي صيغة الغائب المفرد المذكر (הוא).
 * هذه القاعدة هي المصدر الوحيد للحقيقة لكل الأسئلة المولّدة،
 * لذلك أي تعديل فيها يجب أن يكون مدققًا لغويًا.
 */
export const VERBS: Omit<VerbEntry, "rootLetters">[] = [
  // ======================= פעל (קל) =======================
  { root: "כ.ת.ב", binyan: "paal", voice: "active", past3ms: "כתב", present3ms: "כותב", future3ms: "יכתוב", imperative: "כתוב", infinitive: "לכתוב", meaningAr: "كَتَبَ", gizra: "shlemim" },
  { root: "ש.מ.ר", binyan: "paal", voice: "active", past3ms: "שמר", present3ms: "שומר", future3ms: "ישמור", imperative: "שמור", infinitive: "לשמור", meaningAr: "حَفِظَ / حَرَسَ", gizra: "shlemim" },
  { root: "ל.מ.ד", binyan: "paal", voice: "active", past3ms: "למד", present3ms: "לומד", future3ms: "ילמד", imperative: "למד", infinitive: "ללמוד", meaningAr: "تعلَّمَ / دَرَسَ", gizra: "shlemim", notes: "صيغة المستقبل «ילמד» تُكتب مثل مستقبل פיעל «ילמד» (علّم) بدون حركات، والسياق هو الفاصل." },
  { root: "ס.ג.ר", binyan: "paal", voice: "active", past3ms: "סגר", present3ms: "סוגר", future3ms: "יסגור", imperative: "סגור", infinitive: "לסגור", meaningAr: "أَغْلَقَ", gizra: "shlemim" },
  { root: "פ.ת.ח", binyan: "paal", voice: "active", past3ms: "פתח", present3ms: "פותח", future3ms: "יפתח", imperative: "פתח", infinitive: "לפתוח", meaningAr: "فَتَحَ", gizra: "shlemim" },
  { root: "א.כ.ל", binyan: "paal", voice: "active", past3ms: "אכל", present3ms: "אוכל", future3ms: "יאכל", imperative: "אכול", infinitive: "לאכול", meaningAr: "أَكَلَ", gizra: "other" },
  { root: "ב.ד.ק", binyan: "paal", voice: "active", past3ms: "בדק", present3ms: "בודק", future3ms: "יבדוק", imperative: "בדוק", infinitive: "לבדוק", meaningAr: "فَحَصَ", gizra: "shlemim" },
  { root: "ש.ל.ח", binyan: "paal", voice: "active", past3ms: "שלח", present3ms: "שולח", future3ms: "ישלח", imperative: "שלח", infinitive: "לשלוח", meaningAr: "أَرْسَلَ", gizra: "shlemim" },
  { root: "ז.כ.ר", binyan: "paal", voice: "active", past3ms: "זכר", present3ms: "זוכר", future3ms: "יזכור", imperative: "זכור", infinitive: "לזכור", meaningAr: "تَذَكَّرَ", gizra: "shlemim" },
  { root: "ק.ר.א", binyan: "paal", voice: "active", past3ms: "קרא", present3ms: "קורא", future3ms: "יקרא", imperative: "קרא", infinitive: "לקרוא", meaningAr: "قَرَأَ / نادى", gizra: "other" },
  { root: "ע.ב.ד", binyan: "paal", voice: "active", past3ms: "עבד", present3ms: "עובד", future3ms: "יעבוד", imperative: "עבוד", infinitive: "לעבוד", meaningAr: "عَمِلَ", gizra: "shlemim" },
  { root: "ג.ד.ל", binyan: "paal", voice: "active", past3ms: "גדל", present3ms: "גדל", future3ms: "יגדל", infinitive: "לגדול", meaningAr: "كَبِرَ / نَما (لازم)", gizra: "shlemim", notes: "فعل لازم: لا مفعول به. الماضي والحاضر يُكتبان «גדל» ويفترقان بالحركات والسياق." },

  // ======================= נפעל =======================
  { root: "כ.ת.ב", binyan: "nifal", voice: "passive", past3ms: "נכתב", present3ms: "נכתב", future3ms: "ייכתב", infinitive: "להיכתב", meaningAr: "كُتِبَ", activeCounterpart: "כתב", gizra: "shlemim" },
  { root: "ש.מ.ר", binyan: "nifal", voice: "passive", past3ms: "נשמר", present3ms: "נשמר", future3ms: "יישמר", imperative: "הישמר", infinitive: "להישמר", meaningAr: "حُفِظَ", activeCounterpart: "שמר", gizra: "shlemim" },
  { root: "ס.ג.ר", binyan: "nifal", voice: "passive", past3ms: "נסגר", present3ms: "נסגר", future3ms: "ייסגר", infinitive: "להיסגר", meaningAr: "أُغْلِقَ / انغلق", activeCounterpart: "סגר", gizra: "shlemim" },
  { root: "פ.ת.ח", binyan: "nifal", voice: "passive", past3ms: "נפתח", present3ms: "נפתח", future3ms: "ייפתח", infinitive: "להיפתח", meaningAr: "فُتِحَ / انفتح", activeCounterpart: "פתח", gizra: "shlemim" },
  { root: "ב.ד.ק", binyan: "nifal", voice: "passive", past3ms: "נבדק", present3ms: "נבדק", future3ms: "ייבדק", infinitive: "להיבדק", meaningAr: "فُحِصَ", activeCounterpart: "בדק", gizra: "shlemim" },
  { root: "ש.ל.ח", binyan: "nifal", voice: "passive", past3ms: "נשלח", present3ms: "נשלח", future3ms: "יישלח", infinitive: "להישלח", meaningAr: "أُرْسِلَ", activeCounterpart: "שלח", gizra: "shlemim" },
  { root: "כ.נ.ס", binyan: "nifal", voice: "middle", past3ms: "נכנס", present3ms: "נכנס", future3ms: "ייכנס", imperative: "היכנס", infinitive: "להיכנס", meaningAr: "دَخَلَ", gizra: "pei-nun", notes: "נפעל لكنه ليس مبنيًا للمجهول: لا يوجد فاعل محجوب، والفعل لازم." },
  { root: "פ.ג.ש", binyan: "nifal", voice: "middle", past3ms: "נפגש", present3ms: "נפגש", future3ms: "ייפגש", imperative: "היפגש", infinitive: "להיפגש", meaningAr: "التَقى (بـ)", gizra: "shlemim", notes: "معنى متبادل (הדדי)، وليس مجهولًا." },
  { root: "ש.א.ר", binyan: "nifal", voice: "middle", past3ms: "נשאר", present3ms: "נשאר", future3ms: "יישאר", imperative: "הישאר", infinitive: "להישאר", meaningAr: "بَقِيَ", gizra: "other", notes: "נפעל بمعنى لازم تمامًا، ولا علاقة له بالمجهول." },
  { root: "ל.ח.ם", binyan: "nifal", voice: "middle", past3ms: "נלחם", present3ms: "נלחם", future3ms: "יילחם", imperative: "הילחם", infinitive: "להילחם", meaningAr: "قاتَلَ", gizra: "shlemim", notes: "فاعل حقيقي يقوم بالفعل، فهو ليس مجهولًا." },
  { root: "ז.ה.ר", binyan: "nifal", voice: "middle", past3ms: "נזהר", present3ms: "נזהר", future3ms: "ייזהר", imperative: "היזהר", infinitive: "להיזהר", meaningAr: "احْتَرَسَ", gizra: "other", notes: "נפעל انعكاسي المعنى، وليس مجهولًا." },

  // ======================= פיעל =======================
  { root: "ד.ב.ר", binyan: "piel", voice: "active", past3ms: "דיבר", present3ms: "מדבר", future3ms: "ידבר", imperative: "דבר", infinitive: "לדבר", meaningAr: "تَكَلَّمَ", gizra: "shlemim" },
  { root: "ס.פ.ר", binyan: "piel", voice: "active", past3ms: "סיפר", present3ms: "מספר", future3ms: "יספר", imperative: "ספר", infinitive: "לספר", meaningAr: "حَكى / أخبَرَ", gizra: "shlemim" },
  { root: "ל.מ.ד", binyan: "piel", voice: "active", past3ms: "לימד", present3ms: "מלמד", future3ms: "ילמד", imperative: "למד", infinitive: "ללמד", meaningAr: "عَلَّمَ (غيره)", gizra: "shlemim", notes: "قابله פעל «למד» = تعلَّم. الفرق في المعنى والتصريف لا في الجذر." },
  { root: "ב.ש.ל", binyan: "piel", voice: "active", past3ms: "בישל", present3ms: "מבשל", future3ms: "יבשל", imperative: "בשל", infinitive: "לבשל", meaningAr: "طَبَخَ", gizra: "shlemim" },
  { root: "ט.י.ל", binyan: "piel", voice: "active", past3ms: "טייל", present3ms: "מטייל", future3ms: "יטייל", imperative: "טייל", infinitive: "לטייל", meaningAr: "تَنَزَّهَ", gizra: "other" },
  { root: "ש.ל.ם", binyan: "piel", voice: "active", past3ms: "שילם", present3ms: "משלם", future3ms: "ישלם", imperative: "שלם", infinitive: "לשלם", meaningAr: "دَفَعَ (مالًا)", gizra: "shlemim" },
  { root: "נ.ק.ה", binyan: "piel", voice: "active", past3ms: "ניקה", present3ms: "מנקה", future3ms: "ינקה", imperative: "נקה", infinitive: "לנקות", meaningAr: "نَظَّفَ", gizra: "nahei-lamed-he" },
  { root: "ת.ק.ן", binyan: "piel", voice: "active", past3ms: "תיקן", present3ms: "מתקן", future3ms: "יתקן", imperative: "תקן", infinitive: "לתקן", meaningAr: "أَصْلَحَ", gizra: "shlemim", notes: "«מתקן» حاضر פיעل، ولا يجوز اعتباره התפעל مع أنه يبدأ بـ מת." },
  { root: "ח.פ.ש", binyan: "piel", voice: "active", past3ms: "חיפש", present3ms: "מחפש", future3ms: "יחפש", imperative: "חפש", infinitive: "לחפש", meaningAr: "بَحَثَ عن", gizra: "shlemim" },
  { root: "ס.ד.ר", binyan: "piel", voice: "active", past3ms: "סידר", present3ms: "מסדר", future3ms: "יסדר", imperative: "סדר", infinitive: "לסדר", meaningAr: "رَتَّبَ", gizra: "shlemim" },
  { root: "ג.ד.ל", binyan: "piel", voice: "active", past3ms: "גידל", present3ms: "מגדל", future3ms: "יגדל", imperative: "גדל", infinitive: "לגדל", meaningAr: "رَبّى / زَرَعَ", gizra: "shlemim", notes: "قابله פעל «גדל» (كَبِر، لازم) و הפעיל «הגדיל» (كبَّر الحجم)." },
  { root: "פ.ר.ס.ם", binyan: "piel", voice: "active", past3ms: "פרסם", present3ms: "מפרסם", future3ms: "יפרסם", imperative: "פרסם", infinitive: "לפרסם", meaningAr: "نَشَرَ / أَعْلَنَ", gizra: "other", notes: "جذر رباعي، لذلك لا تظهر الياء في الماضي." },
  { root: "ש.ד.ר", binyan: "piel", voice: "active", past3ms: "שידר", present3ms: "משדר", future3ms: "ישדר", imperative: "שדר", infinitive: "לשדר", meaningAr: "بَثَّ", gizra: "shlemim" },
  { root: "כ.ב.ד", binyan: "piel", voice: "active", past3ms: "כיבד", present3ms: "מכבד", future3ms: "יכבד", imperative: "כבד", infinitive: "לכבד", meaningAr: "احْتَرَمَ / أَكْرَمَ", gizra: "shlemim" },
  { root: "א.ר.ג.ן", binyan: "piel", voice: "active", past3ms: "ארגן", present3ms: "מארגן", future3ms: "יארגן", imperative: "ארגן", infinitive: "לארגן", meaningAr: "نَظَّمَ", gizra: "other", notes: "جذر رباعي مثل פרסם، فلا تظهر الياء في الماضي." },

  // ======================= פועל =======================
  { root: "ס.פ.ר", binyan: "pual", voice: "passive", past3ms: "סופר", present3ms: "מסופר", future3ms: "יסופר", meaningAr: "حُكِيَ / رُوِيَ", activeCounterpart: "סיפר", gizra: "shlemim" },
  { root: "ב.ש.ל", binyan: "pual", voice: "passive", past3ms: "בושל", present3ms: "מבושל", future3ms: "יבושל", meaningAr: "طُبِخَ", activeCounterpart: "בישל", gizra: "shlemim" },
  { root: "ש.ל.ם", binyan: "pual", voice: "passive", past3ms: "שולם", present3ms: "משולם", future3ms: "ישולם", meaningAr: "دُفِعَ", activeCounterpart: "שילם", gizra: "shlemim" },
  { root: "נ.ק.ה", binyan: "pual", voice: "passive", past3ms: "נוקה", present3ms: "מנוקה", future3ms: "ינוקה", meaningAr: "نُظِّفَ", activeCounterpart: "ניקה", gizra: "nahei-lamed-he" },
  { root: "ת.ק.ן", binyan: "pual", voice: "passive", past3ms: "תוקן", present3ms: "מתוקן", future3ms: "יתוקן", meaningAr: "أُصْلِحَ", activeCounterpart: "תיקן", gizra: "shlemim" },
  { root: "ס.ד.ר", binyan: "pual", voice: "passive", past3ms: "סודר", present3ms: "מסודר", future3ms: "יסודר", meaningAr: "رُتِّبَ", activeCounterpart: "סידר", gizra: "shlemim" },
  { root: "ג.ד.ל", binyan: "pual", voice: "passive", past3ms: "גודל", present3ms: "מגודל", future3ms: "יגודל", meaningAr: "رُبِّيَ / زُرِعَ", activeCounterpart: "גידל", gizra: "shlemim" },
  { root: "פ.ר.ס.ם", binyan: "pual", voice: "passive", past3ms: "פורסם", present3ms: "מפורסם", future3ms: "יפורסם", meaningAr: "نُشِرَ", activeCounterpart: "פרסם", gizra: "other" },
  { root: "ש.ד.ר", binyan: "pual", voice: "passive", past3ms: "שודר", present3ms: "משודר", future3ms: "ישודר", meaningAr: "بُثَّ", activeCounterpart: "שידר", gizra: "shlemim" },
  { root: "כ.ב.ד", binyan: "pual", voice: "passive", past3ms: "כובד", present3ms: "מכובד", future3ms: "יכובד", meaningAr: "احْتُرِمَ / أُكْرِمَ", activeCounterpart: "כיבד", gizra: "shlemim" },
  { root: "א.ר.ג.ן", binyan: "pual", voice: "passive", past3ms: "אורגן", present3ms: "מאורגן", future3ms: "יאורגן", meaningAr: "نُظِّمَ", activeCounterpart: "ארגן", gizra: "other" },

  // ======================= הפעיל =======================
  { root: "כ.נ.ס", binyan: "hifil", voice: "active", past3ms: "הכניס", present3ms: "מכניס", future3ms: "יכניס", imperative: "הכנס", infinitive: "להכניס", meaningAr: "أَدْخَلَ", gizra: "pei-nun" },
  { root: "ד.ל.ק", binyan: "hifil", voice: "active", past3ms: "הדליק", present3ms: "מדליק", future3ms: "ידליק", imperative: "הדלק", infinitive: "להדליק", meaningAr: "أَشْعَلَ / أَوْقَدَ", gizra: "shlemim" },
  { root: "ז.מ.ן", binyan: "hifil", voice: "active", past3ms: "הזמין", present3ms: "מזמין", future3ms: "יזמין", imperative: "הזמן", infinitive: "להזמין", meaningAr: "دَعا / حَجَزَ", gizra: "shlemim" },
  { root: "ס.ב.ר", binyan: "hifil", voice: "active", past3ms: "הסביר", present3ms: "מסביר", future3ms: "יסביר", imperative: "הסבר", infinitive: "להסביר", meaningAr: "شَرَحَ", gizra: "shlemim" },
  { root: "ח.ל.ט", binyan: "hifil", voice: "active", past3ms: "החליט", present3ms: "מחליט", future3ms: "יחליט", imperative: "החלט", infinitive: "להחליט", meaningAr: "قَرَّرَ", gizra: "shlemim" },
  { root: "ר.ג.ש", binyan: "hifil", voice: "active", past3ms: "הרגיש", present3ms: "מרגיש", future3ms: "ירגיש", imperative: "הרגש", infinitive: "להרגיש", meaningAr: "أَحَسَّ / شَعَرَ", gizra: "shlemim" },
  { root: "ג.ד.ל", binyan: "hifil", voice: "active", past3ms: "הגדיל", present3ms: "מגדיל", future3ms: "יגדיל", imperative: "הגדל", infinitive: "להגדיל", meaningAr: "كَبَّرَ (الحجم)", gizra: "shlemim" },
  { root: "ש.ל.ם", binyan: "hifil", voice: "active", past3ms: "השלים", present3ms: "משלים", future3ms: "ישלים", imperative: "השלם", infinitive: "להשלים", meaningAr: "أَكْمَلَ", gizra: "shlemim" },
  { root: "ק.ש.ב", binyan: "hifil", voice: "active", past3ms: "הקשיב", present3ms: "מקשיב", future3ms: "יקשיב", imperative: "הקשב", infinitive: "להקשיב", meaningAr: "اسْتَمَعَ", gizra: "shlemim" },
  { root: "ל.ב.ש", binyan: "hifil", voice: "active", past3ms: "הלביש", present3ms: "מלביש", future3ms: "ילביש", imperative: "הלבש", infinitive: "להלביש", meaningAr: "أَلْبَسَ (غيره)", gizra: "shlemim" },
  { root: "כ.ת.ב", binyan: "hifil", voice: "active", past3ms: "הכתיב", present3ms: "מכתיב", future3ms: "יכתיב", imperative: "הכתב", infinitive: "להכתיב", meaningAr: "أَمْلى", gizra: "shlemim" },
  { root: "ע.ב.ר", binyan: "hifil", voice: "active", past3ms: "העביר", present3ms: "מעביר", future3ms: "יעביר", imperative: "העבר", infinitive: "להעביר", meaningAr: "نَقَلَ", gizra: "shlemim" },
  { root: "ד.פ.ס", binyan: "hifil", voice: "active", past3ms: "הדפיס", present3ms: "מדפיס", future3ms: "ידפיס", imperative: "הדפס", infinitive: "להדפיס", meaningAr: "طَبَعَ", gizra: "shlemim" },
  { root: "צ.ל.ח", binyan: "hifil", voice: "active", past3ms: "הצליח", present3ms: "מצליח", future3ms: "יצליח", imperative: "הצלח", infinitive: "להצליח", meaningAr: "نَجَحَ", gizra: "shlemim", notes: "הפעיל لكنه لازم المعنى، فلا يصح تحويله إلى הופעל." },

  // ======================= הופעל =======================
  { root: "כ.נ.ס", binyan: "hufal", voice: "passive", past3ms: "הוכנס", present3ms: "מוכנס", future3ms: "יוכנס", meaningAr: "أُدْخِلَ", activeCounterpart: "הכניס", gizra: "pei-nun" },
  { root: "ד.ל.ק", binyan: "hufal", voice: "passive", past3ms: "הודלק", present3ms: "מודלק", future3ms: "יודלק", meaningAr: "أُشْعِلَ", activeCounterpart: "הדליק", gizra: "shlemim" },
  { root: "ז.מ.ן", binyan: "hufal", voice: "passive", past3ms: "הוזמן", present3ms: "מוזמן", future3ms: "יוזמן", meaningAr: "دُعِيَ / حُجِزَ", activeCounterpart: "הזמין", gizra: "shlemim" },
  { root: "ס.ב.ר", binyan: "hufal", voice: "passive", past3ms: "הוסבר", present3ms: "מוסבר", future3ms: "יוסבר", meaningAr: "شُرِحَ", activeCounterpart: "הסביר", gizra: "shlemim" },
  { root: "ח.ל.ט", binyan: "hufal", voice: "passive", past3ms: "הוחלט", present3ms: "מוחלט", future3ms: "יוחלט", meaningAr: "تَقَرَّرَ (قُرِّرَ)", activeCounterpart: "החליט", gizra: "shlemim" },
  { root: "ג.ד.ל", binyan: "hufal", voice: "passive", past3ms: "הוגדל", present3ms: "מוגדל", future3ms: "יוגדל", meaningAr: "كُبِّرَ (حجمه)", activeCounterpart: "הגדיל", gizra: "shlemim" },
  { root: "ל.ב.ש", binyan: "hufal", voice: "passive", past3ms: "הולבש", present3ms: "מולבש", future3ms: "יולבש", meaningAr: "أُلْبِسَ", activeCounterpart: "הלביש", gizra: "shlemim" },
  { root: "כ.ת.ב", binyan: "hufal", voice: "passive", past3ms: "הוכתב", present3ms: "מוכתב", future3ms: "יוכתב", meaningAr: "أُمْلِيَ", activeCounterpart: "הכתיב", gizra: "shlemim" },
  { root: "ע.ב.ר", binyan: "hufal", voice: "passive", past3ms: "הועבר", present3ms: "מועבר", future3ms: "יועבר", meaningAr: "نُقِلَ", activeCounterpart: "העביר", gizra: "shlemim" },
  { root: "ד.פ.ס", binyan: "hufal", voice: "passive", past3ms: "הודפס", present3ms: "מודפס", future3ms: "יודפס", meaningAr: "طُبِعَ", activeCounterpart: "הדפיס", gizra: "shlemim" },
  { root: "ש.ל.ם", binyan: "hufal", voice: "passive", past3ms: "הושלם", present3ms: "מושלם", future3ms: "יושלם", meaningAr: "أُكْمِلَ", activeCounterpart: "השלים", gizra: "shlemim" },

  // ======================= התפעל =======================
  { root: "ל.ב.ש", binyan: "hitpael", voice: "middle", past3ms: "התלבש", present3ms: "מתלבש", future3ms: "יתלבש", imperative: "התלבש", infinitive: "להתלבש", meaningAr: "لَبِسَ (نفسه)", gizra: "shlemim", notes: "معنى انعكاسي: الفاعل والمفعول نفس الشخص، فليس مجهولًا." },
  { root: "כ.ת.ב", binyan: "hitpael", voice: "middle", past3ms: "התכתב", present3ms: "מתכתב", future3ms: "יתכתב", imperative: "התכתב", infinitive: "להתכתב", meaningAr: "تَراسَلَ", gizra: "shlemim", notes: "معنى متبادل (הדדי)." },
  { root: "ר.ג.ש", binyan: "hitpael", voice: "middle", past3ms: "התרגש", present3ms: "מתרגש", future3ms: "יתרגש", imperative: "התרגש", infinitive: "להתרגש", meaningAr: "تَأَثَّرَ / تَحَمَّسَ", gizra: "shlemim" },
  { root: "ג.ע.ג.ע", binyan: "hitpael", voice: "middle", past3ms: "התגעגע", present3ms: "מתגעגע", future3ms: "יתגעגע", imperative: "התגעגע", infinitive: "להתגעגע", meaningAr: "اشْتاقَ", gizra: "other" },
  { root: "ק.ל.ח", binyan: "hitpael", voice: "middle", past3ms: "התקלח", present3ms: "מתקלח", future3ms: "יתקלח", imperative: "התקלח", infinitive: "להתקלח", meaningAr: "اغْتَسَلَ (استحمّ)", gizra: "shlemim" },
  { root: "י.ש.ב", binyan: "hitpael", voice: "middle", past3ms: "התיישב", present3ms: "מתיישב", future3ms: "יתיישב", imperative: "התיישב", infinitive: "להתיישב", meaningAr: "جَلَسَ / اسْتَقَرَّ", gizra: "other" },
  { root: "ח.ת.ן", binyan: "hitpael", voice: "middle", past3ms: "התחתן", present3ms: "מתחתן", future3ms: "יתחתן", imperative: "התחתן", infinitive: "להתחתן", meaningAr: "تَزَوَّجَ", gizra: "shlemim" },
  { root: "ע.ו.ר.ר", binyan: "hitpael", voice: "middle", past3ms: "התעורר", present3ms: "מתעורר", future3ms: "יתעורר", imperative: "התעורר", infinitive: "להתעורר", meaningAr: "اسْتَيْقَظَ", gizra: "other", rootAccept: ["ע.ו.ר", "ע.ר.ר"], notes: "فعل مضاعف/أجوف: يُكتب جذره في الكتب ע.ו.ר أو ע.ר.ר، والصيغة من وزن התפעל المضاعف (התפולל)." },
  { root: "פ.ת.ח", binyan: "hitpael", voice: "middle", past3ms: "התפתח", present3ms: "מתפתח", future3ms: "יתפתח", imperative: "התפתח", infinitive: "להתפתח", meaningAr: "تَطَوَّرَ", gizra: "shlemim", notes: "نفس جذر «פתח» لكن المعنى والوزن مختلفان تمامًا." },
  { root: "כ.נ.ס", binyan: "hitpael", voice: "middle", past3ms: "התכנס", present3ms: "מתכנס", future3ms: "יתכנס", imperative: "התכנס", infinitive: "להתכנס", meaningAr: "اجْتَمَعَ", gizra: "pei-nun" },
  { root: "ס.ד.ר", binyan: "hitpael", voice: "middle", past3ms: "הסתדר", present3ms: "מסתדר", future3ms: "יסתדר", imperative: "הסתדר", infinitive: "להסתדר", meaningAr: "تَدَبَّرَ أَمْرَهُ / انتظم", gizra: "shlemim", notes: "جذر يبدأ بـ ס فتنقلب التاء إلى موضع بعد الحرف: התסדר ← הסתדר." },
  { root: "ש.מ.ש", binyan: "hitpael", voice: "middle", past3ms: "השתמש", present3ms: "משתמש", future3ms: "ישתמש", imperative: "השתמש", infinitive: "להשתמש", meaningAr: "اسْتَخْدَمَ", gizra: "shlemim", notes: "جذر يبدأ بـ ש: התשמש ← השתמש (قلب مكاني)." },
  { root: "ש.ת.ף", binyan: "hitpael", voice: "middle", past3ms: "השתתף", present3ms: "משתתף", future3ms: "ישתתף", imperative: "השתתף", infinitive: "להשתתף", meaningAr: "شارَكَ", gizra: "shlemim", notes: "قلب مكاني أيضًا: התשתף ← השתתף." },
  { root: "צ.ל.ם", binyan: "hitpael", voice: "middle", past3ms: "הצטלם", present3ms: "מצטלם", future3ms: "יצטלם", imperative: "הצטלם", infinitive: "להצטלם", meaningAr: "تَصَوَّرَ (صُوِّرَ بطلبه)", gizra: "shlemim", notes: "جذر يبدأ بـ צ فتتحول التاء إلى ט: התצלם ← הצטלם." },
];

/** يضيف rootLetters تلقائيًا حتى لا تُكتب يدويًا. */
export const VERB_DATA: VerbEntry[] = VERBS.map((v) => ({
  ...v,
  rootLetters: v.root.split("."),
}));

export function verbsByBinyan(binyan: string): VerbEntry[] {
  return VERB_DATA.filter((v) => v.binyan === binyan);
}
