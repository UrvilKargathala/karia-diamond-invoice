"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Download,
  CalendarDays,
  IndianRupee,
  DollarSign,
  FileText,
} from "lucide-react";
import { useToast } from "@/components/toast";
import { TableSkeleton, KpiSkeleton } from "@/components/skeleton";
import { KpiCard, ChartCard } from "@/components/ui";
import { TrendArea, HighlightBars } from "@/components/charts";
import type { StoredInvoice } from "@/lib/types";

type Period = "monthly" | "yearly";

interface Summary {
  label: string;
  count: number;
  domesticCount: number;
  exportCount: number;
  domesticTotal: number;
  exportTotal: number;
}

function groupInvoices(invoices: StoredInvoice[], period: Period, year: number): Summary[] {
  if (period === "yearly") {
    const years = new Set(invoices.map((i) => new Date(i.date).getFullYear()));
    return Array.from(years)
      .sort((a, b) => b - a)
      .map((y) => {
        const filtered = invoices.filter((i) => new Date(i.date).getFullYear() === y);
        const domestic = filtered.filter((i) => i.type === "domestic");
        const exports = filtered.filter((i) => i.type === "export");
        return {
          label: String(y),
          count: filtered.length,
          domesticCount: domestic.length,
          exportCount: exports.length,
          domesticTotal: domestic.reduce((s, i) => s + i.totalAmount, 0),
          exportTotal: exports.reduce((s, i) => s + i.totalAmount, 0),
        };
      });
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return months.map((m, idx) => {
    const filtered = invoices.filter((i) => {
      const d = new Date(i.date);
      return d.getFullYear() === year && d.getMonth() === idx;
    });
    const domestic = filtered.filter((i) => i.type === "domestic");
    const exports = filtered.filter((i) => i.type === "export");
    return {
      label: m,
      count: filtered.length,
      domesticCount: domestic.length,
      exportCount: exports.length,
      domesticTotal: domestic.reduce((s, i) => s + i.totalAmount, 0),
      exportTotal: exports.reduce((s, i) => s + i.totalAmount, 0),
    };
  }).filter((s) => s.count > 0);
}

function exportToCSV(rows: Summary[], period: string) {
  const header = "Period,Total Invoices,Domestic Count,Export Count,Domestic Total (INR),Export Total (USD)";
  const csv = [
    header,
    ...rows.map((r) =>
      `${r.label},${r.count},${r.domesticCount},${r.exportCount},${r.domesticTotal.toFixed(2)},${r.exportTotal.toFixed(2)}`
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const toast = useToast();
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("monthly");
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then(setInvoices)
      .catch(() => toast("Failed to load invoices", "error"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const years = useMemo(() => {
    const set = new Set(invoices.map((i) => new Date(i.date).getFullYear()));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [invoices]);

  const summaries = useMemo(
    () => groupInvoices(invoices, period, year),
    [invoices, period, year]
  );

  const totals = useMemo(() => ({
    count: summaries.reduce((s, r) => s + r.count, 0),
    domesticTotal: summaries.reduce((s, r) => s + r.domesticTotal, 0),
    exportTotal: summaries.reduce((s, r) => s + r.exportTotal, 0),
  }), [summaries]);

  // oldest -> newest, short labels
  const chartRows = useMemo(
    () => (period === "yearly" ? [...summaries].reverse() : summaries).map((r) => ({ ...r, label: period === "monthly" ? r.label.slice(0, 3) : r.label })),
    [summaries, period]
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Date-wise invoice summaries
          </p>
        </div>
        <button
          onClick={() => exportToCSV(summaries, period === "monthly" ? `${period}_${year}` : period)}
          disabled={summaries.length === 0}
          className="btn btn-primary disabled:opacity-50"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="form-label">Period</label>
            <select
              className="form-input w-36"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          {period === "monthly" && (
            <div>
              <label className="form-label">Year</label>
              <select
                className="form-input w-28"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? <KpiSkeleton cols={3} /> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <KpiCard label="Total Invoices" value={totals.count} icon={<FileText size={16} />} tint="bg-blue-50 text-blue-600 dark:bg-blue-500/15" sub={period === "monthly" ? String(year) : "All years"} />
            <KpiCard label="Domestic Revenue" value={`₹ ${totals.domesticTotal.toLocaleString("en-IN")}`} icon={<IndianRupee size={16} />} tint="bg-green-50 text-green-600 dark:bg-green-500/15" />
            <KpiCard label="Export Revenue" value={`$ ${totals.exportTotal.toLocaleString("en-US")}`} icon={<DollarSign size={16} />} tint="bg-purple-50 text-purple-600 dark:bg-purple-500/15" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
            <ChartCard title="Domestic Revenue" sub="₹ per period">
              <TrendArea data={chartRows.map((r) => ({ label: r.label, value: r.domesticTotal }))} color="#2563eb" height={220} />
            </ChartCard>
            <ChartCard title="Export Revenue" sub="$ per period">
              <HighlightBars data={chartRows.map((r) => ({ label: r.label, value: r.exportTotal }))} color="#9333ea" height={220} />
            </ChartCard>
          </div>
        </>
      )}

      {/* Table */}
      <div className="card">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : summaries.length === 0 ? (
          <div className="py-10 text-center">
            <CalendarDays size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              No invoices found for this period
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">{period === "monthly" ? "Month" : "Year"}</th>
                  <th className="pb-2 font-medium text-center">Total</th>
                  <th className="pb-2 font-medium text-center">Domestic</th>
                  <th className="pb-2 font-medium text-center">Export</th>
                  <th className="pb-2 font-medium text-right">Domestic (INR)</th>
                  <th className="pb-2 font-medium text-right">Export (USD)</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((row) => (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="py-3 font-medium">{row.label}</td>
                    <td className="py-3 text-center">{row.count}</td>
                    <td className="py-3 text-center">{row.domesticCount}</td>
                    <td className="py-3 text-center">{row.exportCount}</td>
                    <td className="py-3 text-right">
                      {row.domesticTotal > 0
                        ? `₹ ${row.domesticTotal.toLocaleString("en-IN")}`
                        : "-"}
                    </td>
                    <td className="py-3 text-right">
                      {row.exportTotal > 0
                        ? `$ ${row.exportTotal.toLocaleString("en-US")}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td className="py-3">Total</td>
                  <td className="py-3 text-center">{totals.count}</td>
                  <td className="py-3 text-center">{summaries.reduce((s, r) => s + r.domesticCount, 0)}</td>
                  <td className="py-3 text-center">{summaries.reduce((s, r) => s + r.exportCount, 0)}</td>
                  <td className="py-3 text-right">₹ {totals.domesticTotal.toLocaleString("en-IN")}</td>
                  <td className="py-3 text-right">$ {totals.exportTotal.toLocaleString("en-US")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
