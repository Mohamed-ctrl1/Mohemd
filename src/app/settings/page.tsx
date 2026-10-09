"use client";

import { useRef, useState } from "react";
import { useAppData } from "@/components/AppDataProvider";
import { Callout, Card, Chip, SectionTitle, StatCard } from "@/components/ui";
import { DATA_VERSION, exportData, importData } from "@/lib/storage";
import { QUESTION_BANK } from "@/data/questionBank";
import { LESSONS } from "@/data/lessons";

export default function SettingsPage() {
  const { data, ready, replaceData, resetData, updateSettings } = useAppData();
  const [msg, setMsg] = useState<{ tone: "info" | "warn" | "tip"; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportData(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hebrew-exam-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ tone: "tip", text: "تم تنزيل ملف النسخة الاحتياطية." });
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    const parsed = importData(text);
    if (!parsed) {
      setMsg({ tone: "warn", text: "الملف غير صالح. تأكد أنه ملف نسخة احتياطية مُصدَّر من هذا الموقع." });
      return;
    }
    replaceData(parsed);
    setMsg({
      tone: "tip",
      text: `تم الاستيراد: ${parsed.answers.length} إجابة و${parsed.exams.length} امتحانًا.`,
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle title="الإعدادات والنسخ الاحتياطي" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="إجابات مسجّلة" value={data.answers.length} />
          <StatCard label="امتحانات" value={data.exams.length} />
          <StatCard label="أخطاء محفوظة" value={Object.keys(data.mistakes).length} />
          <StatCard label="دروس مكتملة" value={`${data.lessonsCompleted.length}/${LESSONS.length}`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          <Chip>إصدار بنية البيانات: {DATA_VERSION}</Chip>
          {/* يُعرض بعد التحميل في المتصفح فقط: التاريخ المحلي يختلف عن وقت الخادم */}
          {ready && <Chip>آخر تحديث: {new Date(data.updatedAt).toLocaleString("ar-EG")}</Chip>}
          <Chip>أسئلة البنك: {QUESTION_BANK.length}</Chip>
        </div>
      </Card>

      <Card>
        <SectionTitle title="الإعدادات الافتراضية للامتحان" subtitle="تُستخدم كبداية في صفحة إعداد الامتحان." />
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5 accent-brand-600"
              checked={data.settings.showHints}
              onChange={(e) => updateSettings({ showHints: e.target.checked })}
            />
            <span className="text-sm font-medium">إظهار التلميحات افتراضيًا</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5 accent-brand-600"
              checked={data.settings.instantFeedback}
              onChange={(e) => updateSettings({ instantFeedback: e.target.checked })}
            />
            <span className="text-sm font-medium">تصحيح فوري بعد كل سؤال افتراضيًا</span>
          </label>
          <div>
            <label className="label" htmlFor="defcount">
              العدد الافتراضي للأسئلة: {data.settings.count}
            </label>
            <input
              id="defcount"
              type="range"
              min={5}
              max={60}
              value={data.settings.count}
              onChange={(e) => updateSettings({ count: Number(e.target.value) })}
              className="w-full accent-brand-600"
            />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle title="النسخ الاحتياطي" subtitle="تصدير واستيراد كل تقدّمك كملف JSON." />
        <Callout tone="info" title="حدود التخزين المحلي">
          البيانات محفوظة في LocalStorage داخل هذا المتصفح على هذا الجهاز فقط. لا تنتقل تلقائيًا بين
          الأجهزة أو المتصفحات، وتُفقد إذا حذفت بيانات الموقع. استخدم التصدير قبل تنظيف المتصفح أو
          قبل الانتقال إلى جهاز آخر.
        </Callout>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={download}>
            تصدير نسخة احتياطية
          </button>
          <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
            استيراد ملف
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </Card>

      <Card className="border-rose-200">
        <SectionTitle title="حذف البيانات" subtitle="يمسح كل التقدّم من هذا المتصفح، ولا يمكن التراجع." />
        {confirmReset ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-rose-700">هل أنت متأكد؟ سيُحذف كل شيء.</span>
            <button
              type="button"
              className="btn bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => {
                resetData();
                setConfirmReset(false);
                setMsg({ tone: "warn", text: "تم حذف كل البيانات المحلية." });
              }}
            >
              نعم، احذف الكل
            </button>
            <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)}>
              إلغاء
            </button>
          </div>
        ) : (
          <button type="button" className="btn-ghost !border-rose-200 !text-rose-700" onClick={() => setConfirmReset(true)}>
            حذف كل البيانات
          </button>
        )}
      </Card>

      {msg && (
        <Callout tone={msg.tone} title="تم">
          {msg.text}
        </Callout>
      )}
    </div>
  );
}
