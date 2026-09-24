"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  FilePlus,
  Globe,
  FileText,
  IndianRupee,
  DollarSign,
  ClipboardList,
  ArrowUpRight,
  Eye,
  Download,
  CalendarDays,
} from "lucide-react";
import { useToast } from "@/components/toast";
import { TableSkeleton, KpiSkeleton } from "@/components/skeleton";
import { getMonthlyBuckets, getMonthlyValues, getMonthLabels } from "@/components/sparkline";
import { ChartCard, Delta, KpiCard, ProgressRow } from "@/components/ui";
import { Donut, HighlightBars, TrendArea } from "@/components/charts";
import type { ConsignmentMemo, StoredInvoice } from "@/lib/types";

const inr = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;
const usd = (n: number) => `$ ${n.toLocaleString("en-US")}`;
const last2 = (a: number[]) => [a[a.length - 1], a[a.length - 2]] as const;

export default function Dashboard() {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [memos, setMemos] = useState<ConsignmentMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<"domestic" | "export">("domestic");
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      fetch("/api/invoices").then((r) => r.json()).then(setInvoices).catch(() => {}),
      fetch("/api/memos").then((r) => r.json()).then(setMemos).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const s = useMemo(() => {
    const domestic = invoices.filter((i) => i.type === "domestic");
    const exports = invoices.filter((i) => i.type === "export");
    const val = (l: StoredInvoice[]) => l.map((i) => ({ date: i.date, amount: i.totalAmount }));
    const labels = getMonthLabels(12);
    const count = getMonthlyBuckets(invoices.map((i) => i.date), 12);
    const inrM = getMonthlyValues(val(domestic), 12);
    const usdM = getMonthlyValues(val(exports), 12);
    const pending = memos.filter((m) => m.status === "pending");
    return {
      domestic: domestic.length,
      export: exports.length,
      totalINR: domestic.reduce((a, i) => a + i.totalAmount, 0),
      totalUSD: exports.reduce((a, i) => a + i.totalAmount, 0),
      count,
      inrM,
      usdM,
      labels,
      pending,
      pendingValue: pending.reduce((a, m) => a + m.totalAmount, 0),
    };
  }, [invoices, memos]);

  const toChart = (v: number[]) => s.labels.map((label, i) => ({ label, value: v[i] }));
  const [cCur, cPrev] = last2(s.count);
  const [iCur, iPrev] = last2(s.inrM);
  const [uCur, uPrev] = last2(s.usdM);

  const recent = invoices.slice(0, 6);
  const today = new Date();
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening";

  const build = async (inv: StoredInvoice) => {
    if (inv.type === "domestic") {
      const { generateDomesticPdf } = await import("@/lib/pdf-domestic");
      return generateDomesticPdf(inv.data);
    }
    const { generateExportPdf } = await import("@/lib/pdf-export");
    return generateExportPdf(inv.data);
  };
  const handlePreview = async (inv: StoredInvoice) =>
    window.open((await build(inv)).output("bloburl") as unknown as string, "_blank");
  const handleDownload = async (inv: StoredInvoice) => {
    (await build(inv)).save(`${inv.invoiceNo.replace(/\//g, "_")}.pdf`);
    toast("PDF downloaded", "info");
  };

  const totalInv = s.domestic + s.export;
  const memoCount = (st: string) => memos.filter((m) => m.status === st).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <CalendarDays size={14} />
            {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/create/domestic" className="btn btn-outline"><FilePlus size={14} /> New Domestic</Link>
          <Link href="/create/export" className="btn btn-primary"><Globe size={14} /> New Export</Link>
        </div>
      </div>

      {/* KPIs */}
      {loading ? <KpiSkeleton /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          <KpiCard label="Total Invoices" value={totalInv} icon={<FileText size={16} />} tint="bg-blue-50 text-blue-600 dark:bg-blue-500/15" delta={<Delta current={cCur} previous={cPrev} />} sub="vs last month" />
          <KpiCard label="Domestic Revenue" value={inr(s.totalINR)} icon={<IndianRupee size={16} />} tint="bg-green-50 text-green-600 dark:bg-green-500/15" delta={<Delta current={iCur} previous={iPrev} />} sub="vs last month" />
          <KpiCard label="Export Revenue" value={usd(s.totalUSD)} icon={<DollarSign size={16} />} tint="bg-purple-50 text-purple-600 dark:bg-purple-500/15" delta={<Delta current={uCur} previous={uPrev} />} sub="vs last month" />
          <KpiCard label="Pending Memos" value={s.pending.length} icon={<ClipboardList size={16} />} tint="bg-amber-50 text-amber-600 dark:bg-amber-500/15" sub={`₹ ${s.pendingValue.toLocaleString("en-IN")} on approval`} />
        </div>
      )}

      {/* Trend + split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <ChartCard
          className="xl:col-span-2"
          title="Revenue"
          sub="Last 12 months"
          action={
            <div className="flex gap-1 bg-gray-100 dark:bg-white/10 rounded-lg p-0.5">
              {(["domestic", "export"] as const).map((k) => (
                <button key={k} onClick={() => setSeries(k)} className={`px-3 py-1 rounded-md text-xs font-medium capitalize ${series === k ? "bg-white dark:bg-white/20 shadow-sm" : "text-gray-500"}`}>
                  {k === "domestic" ? "Domestic ₹" : "Export $"}
                </button>
              ))}
            </div>
          }
        >
          <p className="text-3xl font-bold tracking-tight mb-2">{series === "domestic" ? inr(s.totalINR) : usd(s.totalUSD)}</p>
          <TrendArea
            data={toChart(series === "domestic" ? s.inrM : s.usdM)}
            color={series === "domestic" ? "#2563eb" : "#9333ea"}
            format={series === "domestic" ? inr : usd}
          />
        </ChartCard>

        <ChartCard title="Invoice Split" sub="Domestic vs export">
          <Donut data={[{ name: "Domestic", value: s.domestic, color: "#2563eb" }, { name: "Export", value: s.export, color: "#a855f7" }]} height={190} />
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="flex items-center gap-2 text-gray-500"><i className="w-2.5 h-2.5 rounded-full bg-blue-600" />Domestic</span><b>{s.domestic}</b></div>
            <div className="flex justify-between"><span className="flex items-center gap-2 text-gray-500"><i className="w-2.5 h-2.5 rounded-full bg-purple-500" />Export</span><b>{s.export}</b></div>
          </div>
        </ChartCard>
      </div>

      {/* Recent + side */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[15px]">Recent Invoices</h2>
            <Link href="/invoices" className="text-xs text-blue-600 hover:underline flex items-center gap-1">View all <ArrowUpRight size={12} /></Link>
          </div>
          {loading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : recent.length === 0 ? (
            <div className="py-10 text-center">
              <FileText size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm data-table">
                <thead>
                  <tr className="text-left">
                    <th>Invoice</th><th>Buyer</th><th>Date</th><th className="text-right">Amount</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((inv) => (
                    <tr key={inv.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td>
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${inv.type === "domestic" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15" : "bg-purple-50 text-purple-600 dark:bg-purple-500/15"}`}>
                            {inv.type === "domestic" ? <IndianRupee size={14} /> : <Globe size={14} />}
                          </span>
                          <span className="font-semibold text-[13px] tabular-nums whitespace-nowrap">{inv.invoiceNo}</span>
                        </div>
                      </td>
                      <td className="text-gray-600 dark:text-gray-300">{inv.buyerName}</td>
                      <td className="text-gray-500 text-xs whitespace-nowrap">{new Date(inv.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="text-right font-semibold whitespace-nowrap">{inv.currency === "INR" ? "₹" : "$"} {inv.totalAmount.toLocaleString(inv.currency === "INR" ? "en-IN" : "en-US")}</td>
                      <td className="text-right">
                        <div className="flex gap-0.5 justify-end">
                          <button onClick={() => handlePreview(inv)} className="text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50" title="Preview"><Eye size={14} /></button>
                          <button onClick={() => handleDownload(inv)} className="text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50" title="Download"><Download size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <ChartCard title="Invoices per Month" sub="Last 6 months">
            <HighlightBars data={toChart(s.count).slice(-6)} height={170} />
          </ChartCard>
          <ChartCard title="Memo Status" action={<Link href="/memos" className="text-xs text-blue-600 hover:underline">View</Link>}>
            <div className="space-y-4">
              <ProgressRow label="Pending" value={String(memoCount("pending"))} total={memos.length ? (memoCount("pending") / memos.length) * 100 : 0} color="#f59e0b" />
              <ProgressRow label="Sold" value={String(memoCount("sold"))} total={memos.length ? (memoCount("sold") / memos.length) * 100 : 0} color="#22c55e" />
              <ProgressRow label="Returned" value={String(memoCount("returned"))} total={memos.length ? (memoCount("returned") / memos.length) * 100 : 0} color="#94a3b8" />
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
