import type { Metadata, Viewport } from "next";
import { Cairo, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import { AppDataProvider } from "@/components/AppDataProvider";
import { NavBar } from "@/components/NavBar";

// خطوط مستضافة ذاتيًا عند البناء: لا حاجة لاتصال بشبكة خارجية عند التشغيل
const arabic = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic-next",
  display: "swap",
});
const hebrew = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["500", "700"],
  variable: "--font-hebrew-next",
  display: "swap",
});

export const metadata: Metadata = {
  title: "منصة التحضير لامتحان العبرية — הבניינים والفعل",
  description:
    "موقع تدريب كامل على הבניינים، הפועל، פעיל וסביל، جذور الأفعال وتصريفها، مع امتحانات وتحليل لنقاط الضعف.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1559b5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${arabic.variable} ${hebrew.variable}`}>
      <body>
        <AppDataProvider>
          <NavBar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
          <footer className="border-t border-ink-200 bg-white py-6 text-center text-xs text-ink-500">
            بياناتك محفوظة في متصفحك فقط (LocalStorage)، ولا تنتقل تلقائيًا بين الأجهزة.
            استخدم صفحة الإعدادات لتصدير نسخة احتياطية.
          </footer>
        </AppDataProvider>
      </body>
    </html>
  );
}
