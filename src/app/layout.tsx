import type { Metadata, Viewport } from "next";
import { Cairo, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import { AppDataProvider } from "@/components/AppDataProvider";
import { NavBar } from "@/components/NavBar";
import { ServiceWorker } from "@/components/ServiceWorker";

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

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "منصة التحضير لامتحان العبرية — הבניינים والفعل",
  description:
    "موقع تدريب كامل على הבניינים، הפועל، פעיל וסביל، جذور الأفعال وتصريفها، مع امتحانات وتحليل لنقاط الضعف.",
  applicationName: "עברית — الامتحان",
  manifest: `${basePath}/manifest.webmanifest`,
  // «إضافة إلى الشاشة الرئيسية» على آيفون وآيباد: أيقونة واسم وشريط حالة مناسب
  appleWebApp: {
    capable: true,
    title: "עברית — الامتحان",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: `${basePath}/icons/icon-192.png`, sizes: "192x192", type: "image/png" }],
    apple: [{ url: `${basePath}/icons/apple-touch-icon.png`, sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // يمنع تكبير الصفحة تلقائيًا عند لمس حقول الكتابة على iOS، مع إبقاء
  // التكبير اليدوي متاحًا لمن يحتاجه.
  maximumScale: 5,
  userScalable: true,
  // يملأ الشاشة كاملة على آيفون ذي النتوء، ونعوّض بالمساحات الآمنة في CSS
  viewportFit: "cover",
  themeColor: "#1559b5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${arabic.variable} ${hebrew.variable}`}>
      <head>
        {/*
          Next يُخرج «mobile-web-app-capable» الحديثة فقط، وإصدارات iOS الأقدم
          لا تعرفها، فنضيف الصيغة القديمة يدويًا حتى يفتح التطبيق بلا شريط سفاري
          على كل أجهزة آيفون وآيباد.
        */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ServiceWorker />
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
