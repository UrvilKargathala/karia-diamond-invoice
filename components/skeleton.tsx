"use client";

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="skeleton h-4 flex-1"
              style={{ maxWidth: j === 0 ? "120px" : j === cols - 1 ? "100px" : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card flex items-center gap-3">
      <div className="skeleton w-10 h-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-6 w-16" />
      </div>
    </div>
  );
}

const gridCols: Record<number, string> = {
  3: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6",
  4: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6",
};

export function KpiSkeleton({ cols = 4 }: { cols?: number } = {}) {
  return (
    <div className={gridCols[cols] || gridCols[4]}>
      {Array.from({ length: cols }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function NoteGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card space-y-2">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-5/6" />
          <div className="skeleton h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="skeleton w-5 h-5 rounded" />
            <div className="skeleton h-5 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j}>
                <div className="skeleton h-3 w-20 mb-2" />
                <div className="skeleton h-9 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
