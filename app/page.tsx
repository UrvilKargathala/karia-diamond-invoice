"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  FilePlus,
  Globe,
  FileText,
  IndianRupee,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  CalendarDays,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/toast";
import type { StoredInvoice } from "@/lib/types";

export default function Dashboard() {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then(setInvoices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const domestic = invoices.filter((i) => i.type === "domestic");
    const exports = invoices.filter((i) => i.type === "export");
    const totalINR = domestic.reduce((s, i) => s + i.totalAmount, 0);
    const totalUSD = exports.reduce((s, i) => s + i.totalAmount, 0);

    const now = new Date();
    const thisMonth = invoices.filter((i) => {
      const d = new Date(i.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = invoices.filter((i) => {
      const d = new Date(i.date);
      const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return d.getMonth() === lm && d.getFullYear() === ly;
    });

    return {
      total: invoices.length,
      domestic: domestic.length,
      export: exports.length,
      totalINR,
      totalUSD,
      thisMonth: thisMonth.length,
      lastMonth: lastMonth.length,
      thisMonthINR: thisMonth.filter((i) => i.type === "domestic").reduce((s, i) => s + i.totalAmount, 0),
      thisMonthUSD: thisMonth.filter((i) => i.type === "export").reduce((s, i) => s + i.totalAmount, 0),
    };
  }, [invoices]);

  const recent = invoices.slice(0, 5);
  const trend = stats.thisMonth >= stats.lastMonth ? "up" : "down";
  const trendDiff = Math.abs(stats.thisMonth - stats.lastMonth);

  const today = new Date();
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening";

  const handlePreview = async (inv: StoredInvoice) => {
    if (inv.type === "domestic") {
      const { generateDomesticPdf } = await import("@/lib/pdf-domestic");
      const pdf = await generateDomesticPdf(inv.data);
      window.open(pdf.output("bloburl") as unknown as string, "_blank");
    } else {
      const { generateExportPdf } = await import("@/lib/pdf-export");
      const pdf = generateExportPdf(inv.data);
      window.open(pdf.output("bloburl") as unknown as string, "_blank");
    }
  };

  const handleDownload = async (inv: StoredInvoice) => {
    if (inv.type === "domestic") {
      const { generateDomesticPdf } = await import("@/lib/pdf-domestic");
      const pdf = await generateDomesticPdf(inv.data);
      pdf.save(`${inv.invoiceNo.replace(/\//g, "_")}.pdf`);
    } else {
      const { generateExportPdf } = await import("@/lib/pdf-export");
      const pdf = generateExportPdf(inv.data);
      pdf.save(`${inv.invoiceNo.replace(/\//g, "_")}.pdf`);
    }
    toast("PDF downloaded", "info");
  };

  return (
    <div>
      {/* Welcome Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}</h1>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText size={18} className="text-blue-600" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-green-600">
              {trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trendDiff} vs last mo
            </div>
          </div>
          <p className="text-2xl font-bold">{loading ? "-" : stats.total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Invoices</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <FilePlus size={18} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{loading ? "-" : stats.domestic}</p>
          <p className="text-xs text-gray-500 mt-0.5">Domestic Invoices</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
              <Globe size={18} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{loading ? "-" : stats.export}</p>
          <p className="text-xs text-gray-500 mt-0.5">Export Invoices</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <CalendarDays size={18} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{loading ? "-" : stats.thisMonth}</p>
          <p className="text-xs text-gray-500 mt-0.5">This Month</p>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Domestic Revenue</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {loading ? "-" : `₹ ${stats.totalINR.toLocaleString("en-IN")}`}
          </p>
          <p className="text-xs text-blue-600/70 mt-1">
            This month: ₹ {stats.thisMonthINR.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Export Revenue</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {loading ? "-" : `$ ${stats.totalUSD.toLocaleString("en-US")}`}
          </p>
          <p className="text-xs text-purple-600/70 mt-1">
            This month: $ {stats.thisMonthUSD.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* Recent + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Invoices — 2/3 width */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <h2 className="font-semibold">Recent Invoices</h2>
            </div>
            <Link href="/invoices" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center">
              <FileText size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No invoices yet</p>
              <p className="text-xs text-gray-300 mt-1">Create your first invoice to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 font-medium">Invoice</th>
                    <th className="pb-2 font-medium">Buyer</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${inv.type === "domestic" ? "bg-blue-500" : "bg-purple-500"}`} />
                          <span className="font-mono text-xs">{inv.invoiceNo}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-600">{inv.buyerName}</td>
                      <td className="py-3 text-gray-500 text-xs">
                        {new Date(inv.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {inv.currency === "INR" ? "₹" : "$"} {inv.totalAmount.toLocaleString(inv.currency === "INR" ? "en-IN" : "en-US")}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-0.5 justify-end">
                          <button onClick={() => handlePreview(inv)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50" title="Preview"><Eye size={14} /></button>
                          <button onClick={() => handleDownload(inv)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50" title="Download"><Download size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions — 1/3 width */}
        <div className="space-y-4">
          <Link href="/create/domestic" className="card hover:border-blue-300 transition-colors group block">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0">
                <FilePlus size={20} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm">Domestic Invoice</h3>
                <p className="text-xs text-gray-400 truncate">GST tax invoice</p>
              </div>
              <ArrowUpRight size={16} className="text-gray-300 shrink-0 ml-auto" />
            </div>
          </Link>

          <Link href="/create/export" className="card hover:border-purple-300 transition-colors group block">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors shrink-0">
                <Globe size={20} className="text-purple-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm">Export Invoice</h3>
                <p className="text-xs text-gray-400 truncate">LUT export invoice</p>
              </div>
              <ArrowUpRight size={16} className="text-gray-300 shrink-0 ml-auto" />
            </div>
          </Link>

          <Link href="/invoices" className="card hover:border-gray-300 transition-colors group block">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors shrink-0">
                <FileText size={20} className="text-gray-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm">Invoice History</h3>
                <p className="text-xs text-gray-400 truncate">View all invoices</p>
              </div>
              <ArrowUpRight size={16} className="text-gray-300 shrink-0 ml-auto" />
            </div>
          </Link>

          {/* Mini summary */}
          <div className="card bg-gray-50 border-dashed">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Month Summary</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Invoices</span><span className="font-medium">{stats.thisMonth}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Domestic</span><span className="font-medium">₹ {stats.thisMonthINR.toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Export</span><span className="font-medium">$ {stats.thisMonthUSD.toLocaleString("en-US")}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
