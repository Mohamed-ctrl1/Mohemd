import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <div className="text-4xl">🔎</div>
      <h1 className="mt-3 text-lg font-bold">الصفحة غير موجودة</h1>
      <p className="mt-2 text-sm text-ink-600">قد يكون الرابط قديمًا أو مكتوبًا بصورة خاطئة.</p>
      <Link href="/" className="btn-primary mt-4">
        الصفحة الرئيسية
      </Link>
    </div>
  );
}
