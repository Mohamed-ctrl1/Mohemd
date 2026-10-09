"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/learn", label: "تعلّم المادة" },
  { href: "/exam/setup", label: "امتحان" },
  { href: "/bank", label: "بنك الأسئلة" },
  { href: "/weakness", label: "نقاط ضعفي" },
  { href: "/mistakes", label: "مراجعة الأخطاء" },
  { href: "/history", label: "سجل الامتحانات" },
  { href: "/settings", label: "الإعدادات" },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-sm font-bold text-white he">
            בנ
          </span>
          <span className="text-sm font-bold leading-tight sm:text-base">
            التحضير لامتحان العبرية
            <span className="block text-[11px] font-medium text-ink-500">
              הבניינים · הפועל · פעיל וסביל
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(l.href) ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="القائمة"
          className="btn-ghost !px-3 lg:hidden"
        >
          <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <nav className="border-t border-ink-200 bg-white px-4 pb-4 pt-2 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${
                  isActive(l.href)
                    ? "border-brand-200 bg-brand-50 text-brand-700"
                    : "border-ink-200 text-ink-700"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
