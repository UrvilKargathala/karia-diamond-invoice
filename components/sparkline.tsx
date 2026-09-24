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
