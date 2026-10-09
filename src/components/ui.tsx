"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function He({ children, block = false }: { children: ReactNode; block?: boolean }) {
  return <span className={block ? "he-block" : "he"}>{children}</span>;
}

export function Card({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  const Tag = as;
  return <Tag className={`card p-4 sm:p-5 ${className}`}>{children}</Tag>;
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const tones: Record<string, string> = {
    default: "text-ink-900",
    good: "text-emerald-600",
    warn: "text-amber-600",
    bad: "text-rose-600",
  };
  return (
    <div className="card p-4">
      <div className="text-xs font-medium text-ink-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-[11px] text-ink-400">{hint}</div>}
    </div>
  );
}

export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: string }) {
  const colors: Record<string, string> = {
    brand: "bg-brand-500",
    good: "bg-emerald-500",
    warn: "bg-amber-500",
    bad: "bg-rose-500",
  };
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress-fill ${colors[tone] ?? colors.brand}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/** رسم بياني بسيط بالأعمدة بلا مكتبات خارجية. */
export function BarChart({
  items,
  max = 100,
  unit = "%",
}: {
  items: { label: string; value: number; tone?: string }[];
  max?: number;
  unit?: string;
}) {
  if (!items.length) return <p className="text-sm text-ink-500">لا توجد بيانات بعد.</p>;
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-ink-700">{it.label}</span>
            <span className="text-ink-500">
              {Math.round(it.value)}
              {unit}
            </span>
          </div>
          <ProgressBar value={(it.value / max) * 100} tone={it.tone} />
        </div>
      ))}
    </div>
  );
}

/** رسم خطّي بسيط لتطور العلامات باستعمال SVG. */
export function LineChart({ points }: { points: { x: string; y: number }[] }) {
  if (points.length < 2) {
    return <p className="text-sm text-ink-500">تحتاج امتحانين على الأقل لرسم التطور.</p>;
  }
  const w = 320;
  const h = 120;
  const pad = 14;
  const step = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = pad + i * step;
    const y = h - pad - (Math.max(0, Math.min(100, p.y)) / 100) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" role="img" aria-label="تطور العلامات">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#dde1e9" />
      <line x1={pad} y1={pad} x2={w - pad} y2={pad} stroke="#eef0f4" strokeDasharray="3 3" />
      <polyline points={coords.join(" ")} fill="none" stroke="#2374d6" strokeWidth={2.5} strokeLinecap="round" />
      {coords.map((c, i) => {
        const [x, y] = c.split(",");
        return <circle key={i} cx={x} cy={y} r={3.5} fill="#1559b5" />;
      })}
    </svg>
  );
}

export function Chip({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "good" | "warn" | "bad" | "info";
}) {
  const tones: Record<string, string> = {
    default: "border-ink-200 bg-ink-50 text-ink-600",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
    bad: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-brand-200 bg-brand-50 text-brand-700",
  };
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}

export function Callout({
  tone,
  title,
  children,
}: {
  tone: "info" | "warn" | "tip";
  title: string;
  children: ReactNode;
}) {
  const tones = {
    info: "border-brand-200 bg-brand-50 text-brand-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    tip: "border-emerald-200 bg-emerald-50 text-emerald-900",
  } as const;
  const icon = { info: "ℹ️", warn: "⚠️", tip: "💡" } as const;
  return (
    <div className={`rounded-xl border p-3.5 text-sm leading-7 ${tones[tone]}`}>
      <div className="mb-1 font-bold">
        {icon[tone]} {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function ActionTile({
  href,
  title,
  desc,
  icon,
  tone = "brand",
}: {
  href: string;
  title: string;
  desc: string;
  icon: string;
  tone?: "brand" | "ink" | "emerald" | "amber";
}) {
  const tones: Record<string, string> = {
    brand: "border-brand-200 bg-brand-50 hover:bg-brand-100",
    ink: "border-ink-200 bg-white hover:bg-ink-50",
    emerald: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
    amber: "border-amber-200 bg-amber-50 hover:bg-amber-100",
  };
  return (
    <Link href={href} className={`flex items-start gap-3 rounded-2xl border p-4 transition ${tones[tone]}`}>
      <span className="text-2xl leading-none">{icon}</span>
      <span>
        <span className="block text-sm font-bold text-ink-900">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-ink-600">{desc}</span>
      </span>
    </Link>
  );
}

export function EmptyState({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="card grid place-items-center gap-2 p-8 text-center">
      <div className="text-3xl">🗂️</div>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="max-w-md text-sm text-ink-500">{desc}</p>
      {action}
    </div>
  );
}
