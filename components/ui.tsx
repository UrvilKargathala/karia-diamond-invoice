"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

// % change vs previous period; null hides the badge
export function Delta({ current, previous }: { current: number; previous: number }) {
  if (!previous && !current) return null;
  const pct = previous ? ((current - previous) / previous) * 100 : 100;
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
        up ? "bg-green-50 text-green-600 dark:bg-green-500/15" : "bg-red-50 text-red-600 dark:bg-red-500/15"
      }`}
    >
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export function KpiCard({
  label,
  value,
  icon,
  tint,
  delta,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tint: string; // tailwind classes for icon chip
  delta?: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tint}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <div className="flex items-center gap-2 mt-2 min-h-5">
        {delta}
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
    </div>
  );
}

export function ChartCard({
  title,
  sub,
  action,
  className = "",
  children,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-[15px]">{title}</h2>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ProgressRow({ label, value, total, color }: { label: string; value: string; total: number; color: string; }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, total)}%`, background: color }} />
      </div>
    </div>
  );
}
