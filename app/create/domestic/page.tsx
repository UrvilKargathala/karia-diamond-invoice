"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  Eye,
  Copy,
  FileText,
  IndianRupee,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import Papa from "papaparse";
import { Modal } from "@/components/modal";
import { SlideOver } from "@/components/slide-over";
import { useToast } from "@/components/toast";
import { TableSkeleton, KpiSkeleton } from "@/components/skeleton";
import { LogoField } from "@/components/logo-field";
import { KpiCard, Delta, ChartCard } from "@/components/ui";
import { TrendArea, HighlightBars } from "@/components/charts";
import { getMonthlyBuckets, getMonthlyValues, getMonthLabels } from "@/components/sparkline";
import { KARIA_INDIA, GST_RATES, HSN_CODES } from "@/lib/constants";
import type {
  DomesticInvoiceData,
  DomesticLineItem,
  CompanyInfo,
  StoredInvoice,
  ConsignmentMemo,
} from "@/lib/types";

const emptyBuyer: CompanyInfo = {
  name: "",
  address: "",
  gstin: "",
  stateCode: "24",
  stateName: "Gujarat",
};

const emptyItem: DomesticLineItem = {
  slNo: 1,
  description: "Rough Diamond",
  hsnCode: "71049110",
  quantity: 0,
  unit: "Pcs",
  rate: 0,
  amount: 0,
};

export default function DomesticInvoicePage() {
  const router = useRouter();
  const toast = useToast();

  // --- List state ---
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // --- Form panel state ---
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [logo, setLogo] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("15 Days");
  const [dispatchedThrough, setDispatchedThrough] = useState("Hand to Hand");
  const [destination, setDestination] = useState("Surat");
  const [buyer, setBuyer] = useState<CompanyInfo>({ ...emptyBuyer });
  const [isInterState, setIsInterState] = useState(false);
  const [gstCategory, setGstCategory] = useState<"rough" | "polished">("rough");
  const [items, setItems] = useState<DomesticLineItem[]>([]);
  const [draft, setDraft] = useState<{
    index: number | null;
    item: DomesticLineItem;
  } | null>(null);
  const [fromMemoId, setFromMemoId] = useState<string | null>(null);

  const fetchInvoices = () => {
    setListLoading(true);
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((all: StoredInvoice[]) =>
        setInvoices(all.filter((i) => i.type === "domestic"))
      )
      .catch(() => toast("Failed to load invoices", "error"))
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
    // Handle ?id= or ?clone= from URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const clone = params.get("clone");
    const fromMemo = params.get("fromMemo");
    if (id || clone) openEdit(id || clone!, !!id);
    else if (fromMemo) openFromMemo(fromMemo);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openFromMemo = (memoId: string) => {
    fetch(`/api/memos/${memoId}`)
      .then((r) => r.json())
      .then((memo: ConsignmentMemo) => {
        resetForm();
        setFromMemoId(memoId);
        setBuyer(memo.buyer);
        setItems(memo.items);
        setPanelOpen(true);
      })
      .catch(() => toast("Failed to load memo", "error"));
  };

  // --- KPIs ---
  const kpis = useMemo(() => {
    const total = invoices.length;
    const totalValue = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const avg = total > 0 ? Math.round(totalValue / total) : 0;
    const now = new Date();
    const thisMonth = invoices.filter((i) => {
      const d = new Date(i.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const dates = invoices.map((i) => i.date);
    return {
      total, totalValue, avg, thisMonth,
      sparkCount: getMonthlyBuckets(dates),
      sparkValue: getMonthlyValues(invoices.map((i) => ({ date: i.date, amount: i.totalAmount }))),
    };
  }, [invoices]);

  // --- Form helpers ---
  const resetForm = () => {
    setEditId(null);
    setInvoiceNo("");
    setDate(new Date().toISOString().slice(0, 10));
    setPaymentTerms("15 Days");
    setLogo("");
    setDispatchedThrough("Hand to Hand");
    setDestination("Surat");
    setBuyer({ ...emptyBuyer });
    setIsInterState(false);
    setGstCategory("rough");
    setItems([]);
    setDraft(null);
    setFromMemoId(null);
  };

  const openNew = () => {
    resetForm();
    setPanelOpen(true);
  };

  const openEdit = (id: string, isEdit: boolean) => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((inv: StoredInvoice) => {
        if (inv.type !== "domestic") return;
        const d = inv.data;
        setEditId(isEdit ? id : null);
        setInvoiceNo(isEdit ? d.invoiceNo : "");
        setDate(d.date);
        setPaymentTerms(d.paymentTerms);
        setLogo(d.logo || "");
        setDispatchedThrough(d.dispatchedThrough);
        setDestination(d.destination);
        setBuyer(d.buyer);
        setIsInterState(d.isInterState);
        setGstCategory(d.cgstRate === 0.125 ? "rough" : "polished");
        setItems(d.items);
        setPanelOpen(true);
      })
      .catch(() => toast("Failed to load invoice", "error"));
  };

  const rates = GST_RATES[gstCategory];

  const setDraftField = (
    field: keyof DomesticLineItem,
    value: string | number
  ) => setDraft((d) => d && { ...d, item: { ...d.item, [field]: value } });

  const draftAmount = draft
    ? +(draft.item.quantity * draft.item.rate).toFixed(2)
    : 0;

  const saveDraft = () => {
    if (!draft) return;
    const item = { ...draft.item, amount: draftAmount };
    setItems((prev) =>
      draft.index === null
        ? [...prev, { ...item, slNo: prev.length + 1 }]
        : prev.map((it, i) => (i === draft.index ? item : it))
    );
    setDraft(null);
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((item, i) => ({ ...item, slNo: i + 1 }));
    });
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: DomesticLineItem[] = results.data.map(
          (row: Record<string, string>, i: number) => ({
            slNo: i + 1,
            description: row.description || row.Description || "Rough Diamond",
            hsnCode: row.hsn || row.HSN || row.hsnCode || "71049110",
            quantity: parseFloat(row.quantity || row.Quantity || row.qty || "0"),
            unit: row.unit || row.Unit || "Pcs",
            rate: parseFloat(row.rate || row.Rate || row.price || "0"),
            amount: 0,
          })
        );
        parsed.forEach((item) => {
          item.amount = +(item.quantity * item.rate).toFixed(2);
        });
        setItems(parsed);
        toast(`Imported ${parsed.length} items`, "info");
      },
    });
    e.target.value = "";
  };

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const cgstAmount = isInterState ? 0 : +(subtotal * (rates.cgst / 100)).toFixed(2);
  const sgstAmount = isInterState ? 0 : +(subtotal * (rates.sgst / 100)).toFixed(2);
  const igstAmount = isInterState ? +(subtotal * (rates.igst / 100)).toFixed(2) : 0;
  const taxTotal = isInterState ? igstAmount : cgstAmount + sgstAmount;
  const grandTotal = Math.round(subtotal + taxTotal);

  const buildData = (): DomesticInvoiceData => ({
    logo: logo || undefined,
    invoiceNo,
    date,
    paymentTerms,
    dispatchedThrough,
    destination,
    seller: KARIA_INDIA,
    buyer,
    items,
    cgstRate: rates.cgst,
    sgstRate: rates.sgst,
    igstRate: rates.igst,
    isInterState,
  });

  const handlePreview = async () => {
    if (items.length === 0) {
      toast("Add at least one item first", "error");
      return;
    }
    const { generateDomesticPdf } = await import("@/lib/pdf-domestic");
    const pdf = await generateDomesticPdf(buildData());
    window.open(pdf.output("bloburl") as unknown as string, "_blank");
  };

  const handleSubmit = async () => {
    if (!buyer.name.trim()) {
      toast("Buyer name is required", "error");
      return;
    }
    if (items.length === 0 || items.every((i) => i.amount === 0)) {
      toast("Add at least one item with amount > 0", "error");
      return;
    }
    if (buyer.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z0-9]$/.test(buyer.gstin)) {
      toast("GSTIN format looks invalid — save anyway or fix it", "info");
    }

    if (!editId) {
      const dup = invoices.find(
        (i) => i.buyerName === buyer.name && i.totalAmount === grandTotal && i.date === date
      );
      if (dup && !confirm(`Similar invoice found (${dup.invoiceNo}) for same buyer, amount, and date. Create anyway?`)) {
        return;
      }
    }

    setSaving(true);
    const data = buildData();

    try {
      const url = editId ? `/api/invoices/${editId}` : "/api/invoices";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "domestic", data }),
      });
      if (res.ok) {
        const saved = await res.json();
        toast(editId ? "Invoice updated" : "Invoice saved", "success");
        if (fromMemoId) {
          fetch(`/api/memos/${fromMemoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "sold", invoiceId: saved.id }),
          }).catch(() => {});
        }
        const { generateDomesticPdf } = await import("@/lib/pdf-domestic");
        const pdf = await generateDomesticPdf(saved.data);
        pdf.save(`${saved.invoiceNo.replace(/\//g, "_")}.pdf`);
        setPanelOpen(false);
        fetchInvoices();
      } else {
        toast("Failed to save invoice", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  // --- List actions ---
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Invoice deleted", "success");
        fetchInvoices();
      } else toast("Failed to delete", "error");
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (inv: StoredInvoice) => {
    const { generateDomesticPdf } = await import("@/lib/pdf-domestic");
    const pdf = await generateDomesticPdf(inv.data as DomesticInvoiceData);
    pdf.save(`${inv.invoiceNo.replace(/\//g, "_")}.pdf`);
    toast("PDF downloaded", "info");
  };

  const handleListPreview = async (inv: StoredInvoice) => {
    const { generateDomesticPdf } = await import("@/lib/pdf-domestic");
    const pdf = await generateDomesticPdf(inv.data as DomesticInvoiceData);
    window.open(pdf.output("bloburl") as unknown as string, "_blank");
  };

  const fmtINR = (n: number) => "₹ " + n.toLocaleString("en-IN");

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Domestic Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            GST Tax Invoice - Karia India LLP
          </p>
        </div>
        <button onClick={openNew} className="btn btn-primary">
          <Plus size={14} />
          New Domestic Invoice
        </button>
      </div>

      {/* KPI Cards */}
      {listLoading ? <KpiSkeleton /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            <KpiCard label="Total Invoices" value={kpis.total} icon={<FileText size={16} />} tint="bg-blue-50 text-blue-600 dark:bg-blue-500/15" delta={<Delta current={kpis.sparkCount[5]} previous={kpis.sparkCount[4]} />} sub="vs last month" />
            <KpiCard label="Total Value" value={fmtINR(kpis.totalValue)} icon={<IndianRupee size={16} />} tint="bg-green-50 text-green-600 dark:bg-green-500/15" delta={<Delta current={kpis.sparkValue[5]} previous={kpis.sparkValue[4]} />} sub="vs last month" />
            <KpiCard label="Avg Invoice" value={fmtINR(kpis.avg)} icon={<TrendingUp size={16} />} tint="bg-purple-50 text-purple-600 dark:bg-purple-500/15" />
            <KpiCard label="This Month" value={kpis.thisMonth} icon={<CalendarDays size={16} />} tint="bg-amber-50 text-amber-600 dark:bg-amber-500/15" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
            <ChartCard className="xl:col-span-2" title="Value per Month" sub="Last 6 months">
              <TrendArea data={getMonthLabels(6).map((label, i) => ({ label, value: kpis.sparkValue[i] }))} color="#2563eb" height={220} format={fmtINR} />
            </ChartCard>
            <ChartCard title="Invoices per Month" sub="Last 6 months">
              <HighlightBars data={getMonthLabels(6).map((label, i) => ({ label, value: kpis.sparkCount[i] }))} color="#2563eb" height={220} />
            </ChartCard>
          </div>
        </>
      )}

      {/* Invoice Table */}
      <div className="card">
        {listLoading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : invoices.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            No domestic invoices yet. Click &quot;New Domestic Invoice&quot; to create one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Invoice No.</th>
                  <th className="pb-2 font-medium">Buyer</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="py-3 font-semibold text-[13px] tabular-nums whitespace-nowrap">{inv.invoiceNo}</td>
                    <td className="py-3">{inv.buyerName}</td>
                    <td className="py-3 text-gray-500">
                      {new Date(inv.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {fmtINR(inv.totalAmount)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex gap-0.5 justify-end">
                        <button onClick={() => handleListPreview(inv)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50" title="Preview PDF"><Eye size={14} /></button>
                        <button onClick={() => handleDownload(inv)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50" title="Download PDF"><Download size={14} /></button>
                        <button onClick={() => openEdit(inv.id, true)} className="p-1.5 text-gray-400 hover:text-amber-600 rounded hover:bg-amber-50" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => openEdit(inv.id, false)} className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50" title="Duplicate"><Copy size={14} /></button>
                        <button onClick={() => handleDelete(inv.id)} disabled={deleting === inv.id} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 disabled:opacity-50" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Form Panel */}
      <SlideOver
        open={panelOpen}
        title={editId ? "Edit Domestic Invoice" : "New Domestic Invoice"}
        onClose={() => setPanelOpen(false)}
      >
        {/* Invoice Details */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Invoice Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Invoice No. (auto if blank)</label>
              <input type="text" className="form-input" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Auto-generated" />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Payment Terms</label>
              <input type="text" className="form-input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Dispatched Through</label>
              <input type="text" className="form-input" value={dispatchedThrough} onChange={(e) => setDispatchedThrough(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Destination</label>
              <input type="text" className="form-input" value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
            <LogoField value={logo} onChange={setLogo} />
          </div>
        </div>

        {/* Buyer Details */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Buyer Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Company Name *</label>
              <input type="text" className="form-input" value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} placeholder="Buyer company name" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Address</label>
              <textarea className="form-input" rows={2} value={buyer.address} onChange={(e) => setBuyer({ ...buyer, address: e.target.value })} placeholder="Full address" />
            </div>
            <div>
              <label className="form-label">GSTIN</label>
              <input type="text" className="form-input" value={buyer.gstin || ""} onChange={(e) => setBuyer({ ...buyer, gstin: e.target.value.toUpperCase() })} placeholder="22XXXXX1234X1ZX" maxLength={15} />
            </div>
            <div>
              <label className="form-label">State Code</label>
              <input type="text" className="form-input" value={buyer.stateCode || ""} onChange={(e) => setBuyer({ ...buyer, stateCode: e.target.value })} />
            </div>
            <div>
              <label className="form-label">State Name</label>
              <input type="text" className="form-input" value={buyer.stateName || ""} onChange={(e) => setBuyer({ ...buyer, stateName: e.target.value })} />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isInterState} onChange={(e) => setIsInterState(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm font-medium">Inter-State Sale (IGST)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Tax Settings</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <select className="form-input w-48" value={gstCategory} onChange={(e) => setGstCategory(e.target.value as "rough" | "polished")}>
              <option value="rough">Rough Diamond (0.125%)</option>
              <option value="polished">Polished Diamond (0.75%)</option>
            </select>
            <span className="text-sm text-gray-500">
              {isInterState ? `IGST: ${rates.igst}%` : `CGST: ${rates.cgst}% + SGST: ${rates.sgst}%`}
            </span>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Line Items</h3>
            <div className="flex gap-2">
              <label className="btn btn-outline cursor-pointer text-xs">
                <Upload size={14} />
                <span className="hidden sm:inline">Import CSV</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
              </label>
              <button onClick={() => setDraft({ index: null, item: { ...emptyItem } })} className="btn btn-primary text-xs">
                <Plus size={14} /> Add Item
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 w-8">#</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">HSN</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Rate</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 text-gray-400">{item.slNo}</td>
                    <td className="py-2">{item.description}</td>
                    <td className="py-2">{item.hsnCode}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">{item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 text-right font-medium">{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button onClick={() => setDraft({ index: idx, item: { ...item } })} className="text-gray-400 hover:text-gray-700 p-1"><Pencil size={14} /></button>
                      <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={7} className="py-6 text-center text-gray-400">No items yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 border-t pt-4 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              {isInterState ? (
                <div className="flex justify-between">
                  <span className="text-gray-500">IGST ({rates.igst}%)</span>
                  <span>{igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">CGST ({rates.cgst}%)</span>
                    <span>{cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">SGST ({rates.sgst}%)</span>
                    <span>{sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Grand Total</span>
                <span>₹ {grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-wrap gap-3 justify-end border-t pt-4">
          <button onClick={() => setPanelOpen(false)} className="btn btn-outline">Cancel</button>
          <button onClick={handlePreview} className="btn btn-outline"><Eye size={16} /> Preview PDF</button>
          <button onClick={handleSubmit} disabled={saving} className="btn btn-primary disabled:opacity-50">
            <Download size={16} />
            {saving ? "Generating..." : editId ? "Update & Download PDF" : "Save & Download PDF"}
          </button>
        </div>
      </SlideOver>

      {/* Item Modal */}
      <Modal
        open={draft !== null}
        title={draft?.index === null ? "Add Item" : "Edit Item"}
        submitLabel={draft?.index === null ? "Add" : "Save"}
        onClose={() => setDraft(null)}
        onSubmit={saveDraft}
      >
        {draft && (
          <>
            <div className="col-span-2">
              <label className="form-label">Description</label>
              <input type="text" className="form-input" required autoFocus value={draft.item.description} onChange={(e) => setDraftField("description", e.target.value)} />
            </div>
            <div>
              <label className="form-label">HSN Code</label>
              <select className="form-input" value={draft.item.hsnCode} onChange={(e) => setDraftField("hsnCode", e.target.value)}>
                {HSN_CODES.map((h) => (<option key={h.code} value={h.code}>{h.code}</option>))}
              </select>
            </div>
            <div>
              <label className="form-label">Unit</label>
              <select className="form-input" value={draft.item.unit} onChange={(e) => setDraftField("unit", e.target.value)}>
                <option>Pcs</option><option>Cts</option><option>Lot</option>
              </select>
            </div>
            <div>
              <label className="form-label">Quantity</label>
              <input type="number" step="any" min="0" required className="form-input" value={draft.item.quantity || ""} onChange={(e) => setDraftField("quantity", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="form-label">Rate</label>
              <input type="number" step="any" min="0" required className="form-input" value={draft.item.rate || ""} onChange={(e) => setDraftField("rate", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="col-span-2 flex justify-between border-t pt-3 text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="font-semibold">₹ {draftAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
