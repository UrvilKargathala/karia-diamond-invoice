"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = { fontSize: 11, fill: "#94a3b8" };
const tip = { borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", fontSize: 12 };

export const compact = (n: number) =>
  n >= 10000000 ? `${+(n / 10000000).toFixed(1)}Cr` : n >= 100000 ? `${+(n / 100000).toFixed(1)}L` : n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(n);

export function TrendArea({
  data,
  color = "#2563eb",
  height = 260,
  format = (n: number) => n.toLocaleString("en-IN"),
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  format?: (n: number) => string;
}) {
  const id = `g${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={compact} width={48} />
        <Tooltip contentStyle={tip} formatter={(v) => format(Number(v))} />
        <Area isAnimationActive={false} type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${id})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Last bar is highlighted, others muted (like the reference design)
export function HighlightBars({
  data,
  color = "#2563eb",
  height = 220,
  format = (n: number) => n.toLocaleString("en-IN"),
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  format?: (n: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={compact} width={48} allowDecimals={false} />
        <Tooltip contentStyle={tip} cursor={{ fill: "rgba(148,163,184,0.12)" }} formatter={(v) => format(Number(v))} />
        <Bar isAnimationActive={false} dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={36}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === data.length - 1 ? color : color + "40"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({
  data,
  height = 180,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const shown = total ? data : [{ name: "None", value: 1, color: "#e2e8f0" }];
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie isAnimationActive={false} data={shown} dataKey="value" innerRadius="66%" outerRadius="92%" paddingAngle={total ? 3 : 0} stroke="none" cornerRadius={6}>
            {shown.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          {total > 0 && <Tooltip contentStyle={tip} />}
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold">{total}</span>
        <span className="text-[11px] text-gray-400">invoices</span>
      </div>
    </div>
  );
}
