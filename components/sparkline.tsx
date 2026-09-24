"use client";

export function Sparkline({
  data,
  color = "currentColor",
  width = 60,
  height = 24,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const step = width / (data.length - 1);
  const pad = 2;
  const h = height - pad * 2;

  const points = data.map((v, i) => `${i * step},${pad + h - (v / max) * h}`).join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={areaPoints}
        fill={color}
        fillOpacity={0.1}
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function getMonthlyBuckets(
  dates: string[],
  months = 6,
): number[] {
  const now = new Date();
  const buckets = Array(months).fill(0);
  for (const d of dates) {
    const dt = new Date(d);
    const diff = (now.getFullYear() - dt.getFullYear()) * 12 + now.getMonth() - dt.getMonth();
    if (diff >= 0 && diff < months) buckets[months - 1 - diff]++;
  }
  return buckets;
}

export function getMonthlyValues(
  items: { date: string; amount: number }[],
  months = 6,
): number[] {
  const now = new Date();
  const buckets = Array(months).fill(0);
  for (const { date, amount } of items) {
    const dt = new Date(date);
    const diff = (now.getFullYear() - dt.getFullYear()) * 12 + now.getMonth() - dt.getMonth();
    if (diff >= 0 && diff < months) buckets[months - 1 - diff] += amount;
  }
  return buckets;
}

export function getMonthLabels(months = 6): string[] {
  const now = new Date();
  return Array.from({ length: months }, (_, i) =>
    new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1).toLocaleString("en-IN", { month: "short" }),
  );
}

// Plain CSS bar chart: value on top of each bar, month label below.
export function BarChart({
  data,
  color,
  format = (n: number) => (n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(n)),
  height = 90,
}: {
  data: number[];
  color: string;
  format?: (n: number) => string;
  height?: number;
}) {
  const labels = getMonthLabels(data.length);
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1.5 mt-3" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full min-w-0" title={`${labels[i]}: ${v.toLocaleString("en-IN")}`}>
          <span className="text-[9px] text-gray-500 leading-none mb-0.5">{v ? format(v) : ""}</span>
          <div className="w-full rounded-t" style={{ height: `${(v / max) * 60}%`, minHeight: v ? 3 : 1, background: color, opacity: v ? 1 : 0.2 }} />
          <span className="text-[9px] text-gray-400 leading-none mt-1">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
