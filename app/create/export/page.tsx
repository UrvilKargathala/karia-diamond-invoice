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
  DollarSign,
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
import { BRILLIANT_LABGROWN, KARIA_DIAMONDS_INC } from "@/lib/constants";
import type {
  ExportInvoiceData,
  ExportLineItem,
  PackingListItem,
  CompanyInfo,
  ShippingDetails,
  StoredInvoice,
  ConsignmentMemo,
} from "@/lib/types";

const emptyItem: ExportLineItem = {
  slNo: 1,
  typeShapeColourClarity:
    "LAB GROWN CUT & POLISHED DIAMOND PLATES (PARTS FOR SEMI CONDUCTORS WAFERS)\nLAB GROWN\nCVD CODE - LGD001",
  hsnCode: "71049110",
  carats: 0,
  ratePerCarat: 0,
  amount: 0,
};

const emptyStone: PackingListItem = {
  no: 1,
  shape: "SQUARE",
  stoneId: "",
  type: "CVD",
  desc: "WAFERS",
  size: "10 X 10 X 0.3",
  pcs: 1,
  weight: 0,
  pricePerCt: 0,
  amount: 0,
};

const renumber = <T,>(list: T[], key: keyof T) =>
  list.map((item, i) => ({ ...item, [key]: i + 1 }));

export default function ExportInvoicePage() {
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
  const [paymentTerms, setPaymentTerms] = useState("Advance");
  const [lutArnNo, setLutArnNo] = useState("AD2403260556888R");
  const [lutArnDate, setLutArnDate] = useState("28-03-2026");
  const [currency, setCurrency] = useState("USD");

  const [consignee, setConsignee] = useState<CompanyInfo>({ ...KARIA_DIAMONDS_INC });
  const [shipping, setShipping] = useState<ShippingDetails>({
    preCarriageBy: "M.A EXPRESS",
    placeOfReceipt: "N.A.",
    vesselFlightNo: "",
    portOfLoading: "SURAT",
    portOfDischarge: "MASSACHUSETTS",
    finalDestination: "USA",
    countryOfOrigin: "INDIA",
    countryOfFinalDestination: "USA",
    marksAndNos: "",
    noAndKindOfPkgs: "One Tin Box",
  });

  const [items, setItems] = useState<ExportLineItem[]>([]);
  const [packingList, setPackingList] = useState<PackingListItem[]>([]);
  const [shippingCharges, setShippingCharges] = useState(250);

  const [itemDraft, setItemDraft] = useState<{ index: number | null; item: ExportLineItem } | null>(null);
  const [stoneDraft, setStoneDraft] = useState<{ index: number | null; item: PackingListItem } | null>(null);
  const [fromMemoId, setFromMemoId] = useState<string | null>(null);

  const fetchInvoices = () => {
    setListLoading(true);
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((all: StoredInvoice[]) =>
        setInvoices(all.filter((i) => i.type === "export"))
      )
      .catch(() => toast("Failed to load invoices", "error"))
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
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
        setCurrency(memo.currency);
        setConsignee(memo.buyer);
        setItems(
          memo.items.map((it) => ({
            slNo: it.slNo,
            typeShapeColourClarity: it.description,
            hsnCode: it.hsnCode,
            carats: it.quantity,
            ratePerCarat: it.rate,
            amount: it.amount,
          }))
        );
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
    setPaymentTerms("Advance");
    setLogo("");
    setLutArnNo("AD2403260556888R");
    setLutArnDate("28-03-2026");
    setCurrency("USD");
    setConsignee({ ...KARIA_DIAMONDS_INC });
    setShipping({
      preCarriageBy: "M.A EXPRESS", placeOfReceipt: "N.A.", vesselFlightNo: "",
      portOfLoading: "SURAT", portOfDischarge: "MASSACHUSETTS", finalDestination: "USA",
      countryOfOrigin: "INDIA", countryOfFinalDestination: "USA", marksAndNos: "", noAndKindOfPkgs: "One Tin Box",
    });
    setItems([]);
    setPackingList([]);
    setShippingCharges(250);
    setItemDraft(null);
    setStoneDraft(null);
    setFromMemoId(null);
  };

  const openNew = () => { resetForm(); setPanelOpen(true); };

  const openEdit = (id: string, isEdit: boolean) => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((inv: StoredInvoice) => {
        if (inv.type !== "export") return;
        const d = inv.data;
        setEditId(isEdit ? id : null);
        setInvoiceNo(isEdit ? d.invoiceNo : "");
        setDate(d.date);
        setPaymentTerms(d.paymentTerms);
        setLogo(d.logo || "");
        setLutArnNo(d.lutArnNo || "");
        setLutArnDate(d.lutArnDate || "");
        setCurrency((d as ExportInvoiceData & { currency?: string }).currency || "USD");
        setConsignee(d.consignee);
        setShipping(d.shipping);
        setItems(d.items);
        setPackingList(d.packingList);
        setShippingCharges(d.shippingCharges);
        setPanelOpen(true);
      })
      .catch(() => toast("Failed to load invoice", "error"));
  };

  // --- Item/stone drafts ---
  const setItemField = (field: keyof ExportLineItem, value: string | number) =>
    setItemDraft((d) => d && { ...d, item: { ...d.item, [field]: value } });
  const setStoneField = (field: keyof PackingListItem, value: string | number) =>
    setStoneDraft((d) => d && { ...d, item: { ...d.item, [field]: value } });

  const itemDraftAmount = itemDraft ? +(itemDraft.item.carats * itemDraft.item.ratePerCarat).toFixed(2) : 0;
  const stoneDraftAmount = stoneDraft ? +(stoneDraft.item.weight * stoneDraft.item.pricePerCt).toFixed(2) : 0;

  const saveItem = () => {
    if (!itemDraft) return;
    const item = { ...itemDraft.item, amount: itemDraftAmount };
    setItems((prev) => renumber(itemDraft.index === null ? [...prev, item] : prev.map((it, i) => (i === itemDraft.index ? item : it)), "slNo"));
    setItemDraft(null);
  };

  const saveStone = () => {
    if (!stoneDraft) return;
    const item = { ...stoneDraft.item, amount: stoneDraftAmount };
    setPackingList((prev) => renumber(stoneDraft.index === null ? [...prev, item] : prev.map((it, i) => (i === stoneDraft.index ? item : it)), "no"));
    setStoneDraft(null);
  };

  const removeItem = (index: number) => setItems((prev) => renumber(prev.filter((_, i) => i !== index), "slNo"));
  const removePackingItem = (index: number) => setPackingList((prev) => renumber(prev.filter((_, i) => i !== index), "no"));

  const handlePackingListCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: PackingListItem[] = results.data.map((row: Record<string, string>, i: number) => {
          const weight = parseFloat(row.weight || row.Weight || "0");
          const pricePerCt = parseFloat(row.pricePerCt || row.Price || row["Price/Ct"] || "0");
          return {
            no: i + 1, shape: row.shape || row.Shape || "", stoneId: row.stoneId || row["Stone ID"] || row.stone_id || "",
            type: row.type || row.Type || "CVD", desc: row.desc || row.Desc || row.description || "WAFERS",
            size: row.size || row.Size || row.SIZE || "", pcs: parseInt(row.pcs || row.Pcs || "1"),
            weight, pricePerCt, amount: +(weight * pricePerCt).toFixed(2),
          };
        });
        setPackingList(parsed);
        const totalCarats = parsed.reduce((s, p) => s + p.weight, 0);
        const totalAmount = parsed.reduce((s, p) => s + p.amount, 0);
        const avgRate = totalCarats > 0 ? +(totalAmount / totalCarats).toFixed(2) : 0;
        setItems([{ ...(items[0] ?? emptyItem), slNo: 1, carats: +totalCarats.toFixed(2), ratePerCarat: avgRate, amount: +totalAmount.toFixed(2) }]);
        toast(`Imported ${parsed.length} stones`, "info");
      },
    });
    e.target.value = "";
  };

  const goodsTotal = items.reduce((s, i) => s + i.amount, 0);
  const cifTotal = goodsTotal + shippingCharges;

  const currSymbol = currency === "USD" ? "US$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "AED" ? "AED" : currency === "HKD" ? "HK$" : currency;

  const buildData = (): ExportInvoiceData => ({
    logo: logo || undefined, invoiceNo, date, exporterRef: BRILLIANT_LABGROWN.iecNo || "", exporter: BRILLIANT_LABGROWN,
    consignee, shipping, paymentTerms, items, packingList, shippingCharges, lutArnNo, lutArnDate,
    currency,
  } as ExportInvoiceData);

  const handlePreview = async () => {
    if (items.length === 0) { toast("Add at least one item first", "error"); return; }
    const { generateExportPdf } = await import("@/lib/pdf-export");
    const pdf = generateExportPdf(buildData());
    window.open(pdf.output("bloburl") as unknown as string, "_blank");
  };

  const handleSubmit = async () => {
    if (!consignee.name.trim()) { toast("Consignee name is required", "error"); return; }
    if (items.length === 0 || items.every((i) => i.amount === 0)) { toast("Add at least one item with amount > 0", "error"); return; }

    if (!editId) {
      const dup = invoices.find(
        (i) => i.buyerName === consignee.name && i.totalAmount === cifTotal && i.date === date
      );
      if (dup && !confirm(`Similar invoice found (${dup.invoiceNo}) for same consignee, amount, and date. Create anyway?`)) {
        return;
      }
    }

    setSaving(true);
    try {
      const url = editId ? `/api/invoices/${editId}` : "/api/invoices";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "export", data: buildData() }) });
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
        const { generateExportPdf } = await import("@/lib/pdf-export");
        const pdf = generateExportPdf(saved.data);
        pdf.save(`${saved.invoiceNo.replace(/\//g, "_")}.pdf`);
        setPanelOpen(false);
        fetchInvoices();
      } else toast("Failed to save invoice", "error");
    } catch { toast("Something went wrong", "error"); }
    finally { setSaving(false); }
  };

  // --- List actions ---
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) { toast("Invoice deleted", "success"); fetchInvoices(); }
      else toast("Failed to delete", "error");
    } catch { toast("Something went wrong", "error"); }
    finally { setDeleting(null); }
  };

  const handleDownload = async (inv: StoredInvoice) => {
    const { generateExportPdf } = await import("@/lib/pdf-export");
    const pdf = generateExportPdf(inv.data as ExportInvoiceData);
    pdf.save(`${inv.invoiceNo.replace(/\//g, "_")}.pdf`);
    toast("PDF downloaded", "info");
  };

  const handleListPreview = async (inv: StoredInvoice) => {
    const { generateExportPdf } = await import("@/lib/pdf-export");
    const pdf = generateExportPdf(inv.data as ExportInvoiceData);
    window.open(pdf.output("bloburl") as unknown as string, "_blank");
  };

  const fmtCurr = (n: number) => `${currSymbol} ${n.toLocaleString("en-US")}`;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Export Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Tax Invoice under LUT - Without Payment of IGST</p>
        </div>
        <button onClick={openNew} className="btn btn-primary"><Plus size={14} /> New Export Invoice</button>
      </div>

      {/* KPI Cards */}
      {listLoading ? <KpiSkeleton /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            <KpiCard label="Total Invoices" value={kpis.total} icon={<FileText size={16} />} tint="bg-blue-50 text-blue-600 dark:bg-blue-500/15" delta={<Delta current={kpis.sparkCount[5]} previous={kpis.sparkCount[4]} />} sub="vs last month" />
            <KpiCard label="Total Value" value={fmtCurr(kpis.totalValue)} icon={<DollarSign size={16} />} tint="bg-green-50 text-green-600 dark:bg-green-500/15" delta={<Delta current={kpis.sparkValue[5]} previous={kpis.sparkValue[4]} />} sub="vs last month" />
            <KpiCard label="Avg Invoice" value={fmtCurr(kpis.avg)} icon={<TrendingUp size={16} />} tint="bg-purple-50 text-purple-600 dark:bg-purple-500/15" />
            <KpiCard label="This Month" value={kpis.thisMonth} icon={<CalendarDays size={16} />} tint="bg-amber-50 text-amber-600 dark:bg-amber-500/15" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
            <ChartCard className="xl:col-span-2" title="Value per Month" sub="Last 6 months">
              <TrendArea data={getMonthLabels(6).map((label, i) => ({ label, value: kpis.sparkValue[i] }))} color="#9333ea" height={220} format={fmtCurr} />
            </ChartCard>
            <ChartCard title="Invoices per Month" sub="Last 6 months">
              <HighlightBars data={getMonthLabels(6).map((label, i) => ({ label, value: kpis.sparkCount[i] }))} color="#9333ea" height={220} />
            </ChartCard>
          </div>
        </>
      )}

      {/* Invoice Table */}
      <div className="card">
        {listLoading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : invoices.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No export invoices yet. Click &quot;New Export Invoice&quot; to create one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Invoice No.</th>
                  <th className="pb-2 font-medium">Consignee</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium text-right">Amount ({currSymbol})</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="py-3 font-semibold text-[13px] tabular-nums whitespace-nowrap">{inv.invoiceNo}</td>
                    <td className="py-3">{inv.buyerName}</td>
                    <td className="py-3 text-gray-500">{new Date(inv.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="py-3 text-right font-medium">{fmtCurr(inv.totalAmount)}</td>
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
      <SlideOver open={panelOpen} title={editId ? "Edit Export Invoice" : "New Export Invoice"} onClose={() => setPanelOpen(false)}>
        {/* Invoice Details */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Invoice Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="form-label">Invoice No. (auto if blank)</label><input type="text" className="form-input" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Auto-generated" /></div>
            <div><label className="form-label">Date</label><input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className="form-label">Payment Terms</label><input type="text" className="form-input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} /></div>
            <div><label className="form-label">LUT/ARN No.</label><input type="text" className="form-input" value={lutArnNo} onChange={(e) => setLutArnNo(e.target.value)} /></div>
            <div><label className="form-label">LUT/ARN Date</label><input type="text" className="form-input" value={lutArnDate} onChange={(e) => setLutArnDate(e.target.value)} /></div>
            <LogoField value={logo} onChange={setLogo} />
            <div>
              <label className="form-label">Currency</label>
              <select className="form-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED</option>
                <option value="HKD">HKD (HK$)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Consignee Details */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Consignee Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2"><label className="form-label">Company Name *</label><input type="text" className="form-input" value={consignee.name} onChange={(e) => setConsignee({ ...consignee, name: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="form-label">Address</label><textarea className="form-input" rows={2} value={consignee.address} onChange={(e) => setConsignee({ ...consignee, address: e.target.value })} /></div>
            <div><label className="form-label">Contact No.</label><input type="text" className="form-input" value={consignee.mobile || ""} onChange={(e) => setConsignee({ ...consignee, mobile: e.target.value })} /></div>
            <div><label className="form-label">Email</label><input type="email" className="form-input" value={consignee.email || ""} onChange={(e) => setConsignee({ ...consignee, email: e.target.value })} /></div>
          </div>
        </div>

        {/* Shipping Details */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Shipping Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="form-label">Pre-Carriage By</label><input type="text" className="form-input" value={shipping.preCarriageBy} onChange={(e) => setShipping({ ...shipping, preCarriageBy: e.target.value })} /></div>
            <div><label className="form-label">Vessel/Flight No.</label><input type="text" className="form-input" value={shipping.vesselFlightNo} onChange={(e) => setShipping({ ...shipping, vesselFlightNo: e.target.value })} /></div>
            <div><label className="form-label">Port of Loading</label><input type="text" className="form-input" value={shipping.portOfLoading} onChange={(e) => setShipping({ ...shipping, portOfLoading: e.target.value })} /></div>
            <div><label className="form-label">Port of Discharge</label><input type="text" className="form-input" value={shipping.portOfDischarge} onChange={(e) => setShipping({ ...shipping, portOfDischarge: e.target.value })} /></div>
            <div><label className="form-label">Final Destination</label><input type="text" className="form-input" value={shipping.finalDestination} onChange={(e) => setShipping({ ...shipping, finalDestination: e.target.value })} /></div>
            <div><label className="form-label">No. & Kind of Pkgs</label><input type="text" className="form-input" value={shipping.noAndKindOfPkgs} onChange={(e) => setShipping({ ...shipping, noAndKindOfPkgs: e.target.value })} /></div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Invoice Items</h3>
            <button onClick={() => setItemDraft({ index: null, item: { ...emptyItem } })} className="btn btn-primary text-xs"><Plus size={14} /> Add Item</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b">
                <th className="pb-2 w-8">#</th><th className="pb-2">Description</th><th className="pb-2">HSN</th>
                <th className="pb-2 text-right">Cts</th><th className="pb-2 text-right">Rate</th><th className="pb-2 text-right">Amount</th><th className="pb-2 w-16"></th>
              </tr></thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b align-top">
                    <td className="py-2 text-gray-400">{item.slNo}</td>
                    <td className="py-2 whitespace-pre-line text-xs">{item.typeShapeColourClarity}</td>
                    <td className="py-2">{item.hsnCode}</td>
                    <td className="py-2 text-right">{item.carats}</td>
                    <td className="py-2 text-right">{item.ratePerCarat.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 text-right font-medium">{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button onClick={() => setItemDraft({ index: idx, item: { ...item } })} className="text-gray-400 hover:text-gray-700 p-1"><Pencil size={14} /></button>
                      <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-gray-400">No items yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-4 border-t pt-4 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Goods Total</span><span>{currSymbol} {goodsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Shipping</span><input type="number" className="form-input w-24 text-right" value={shippingCharges || ""} onChange={(e) => setShippingCharges(parseFloat(e.target.value) || 0)} /></div>
              <div className="flex justify-between border-t pt-2 text-base font-bold"><span>CIF Total</span><span>{currSymbol} {cifTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
            </div>
          </div>
        </div>

        {/* Packing List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Packing List</h3>
            <div className="flex gap-2">
              <label className="btn btn-outline cursor-pointer text-xs"><Upload size={14} /><span className="hidden sm:inline">Import CSV</span><input type="file" accept=".csv" className="hidden" onChange={handlePackingListCsv} /></label>
              <button onClick={() => setStoneDraft({ index: null, item: { ...emptyStone } })} className="btn btn-primary text-xs"><Plus size={14} /> Add Stone</button>
            </div>
          </div>
          {packingList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 w-8">#</th><th className="pb-2">Shape</th><th className="pb-2">Stone ID</th>
                  <th className="pb-2">Type</th><th className="pb-2">Size</th><th className="pb-2 text-right">Pcs</th>
                  <th className="pb-2 text-right">Wt</th><th className="pb-2 text-right">$/Ct</th><th className="pb-2 text-right">Amt</th><th className="pb-2 w-14"></th>
                </tr></thead>
                <tbody>
                  {packingList.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-1.5 text-gray-400">{item.no}</td>
                      <td className="py-1.5">{item.shape}</td>
                      <td className="py-1.5">{item.stoneId}</td>
                      <td className="py-1.5">{item.type}</td>
                      <td className="py-1.5">{item.size}</td>
                      <td className="py-1.5 text-right">{item.pcs}</td>
                      <td className="py-1.5 text-right">{item.weight}</td>
                      <td className="py-1.5 text-right">{item.pricePerCt.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className="py-1.5 text-right font-medium">{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className="py-1.5 text-right whitespace-nowrap">
                        <button onClick={() => setStoneDraft({ index: idx, item: { ...item } })} className="text-gray-400 hover:text-gray-700 p-1"><Pencil size={12} /></button>
                        <button onClick={() => removePackingItem(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No packing list items. Add manually or import CSV.</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-wrap gap-3 justify-end border-t pt-4">
          <button onClick={() => setPanelOpen(false)} className="btn btn-outline">Cancel</button>
          <button onClick={handlePreview} className="btn btn-outline"><Eye size={16} /> Preview PDF</button>
          <button onClick={handleSubmit} disabled={saving} className="btn btn-primary disabled:opacity-50">
            <Download size={16} /> {saving ? "Generating..." : editId ? "Update & Download PDF" : "Save & Download PDF"}
          </button>
        </div>
      </SlideOver>

      {/* Item Modal */}
      <Modal open={itemDraft !== null} title={itemDraft?.index === null ? "Add Invoice Item" : "Edit Invoice Item"} submitLabel={itemDraft?.index === null ? "Add" : "Save"} onClose={() => setItemDraft(null)} onSubmit={saveItem}>
        {itemDraft && (<>
          <div className="col-span-2"><label className="form-label">Type / Shape / Colour / Clarity</label><textarea className="form-input text-xs" rows={3} required autoFocus value={itemDraft.item.typeShapeColourClarity} onChange={(e) => setItemField("typeShapeColourClarity", e.target.value)} /></div>
          <div className="col-span-2"><label className="form-label">HSN Code</label><input type="text" className="form-input" value={itemDraft.item.hsnCode} onChange={(e) => setItemField("hsnCode", e.target.value)} /></div>
          <div><label className="form-label">Carats</label><input type="number" step="any" min="0" required className="form-input" value={itemDraft.item.carats || ""} onChange={(e) => setItemField("carats", parseFloat(e.target.value) || 0)} /></div>
          <div><label className="form-label">Rate / Carat ({currSymbol})</label><input type="number" step="any" min="0" required className="form-input" value={itemDraft.item.ratePerCarat || ""} onChange={(e) => setItemField("ratePerCarat", parseFloat(e.target.value) || 0)} /></div>
          <div className="col-span-2 flex justify-between border-t pt-3 text-sm"><span className="text-gray-500">Amount</span><span className="font-semibold">{currSymbol} {itemDraftAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
        </>)}
      </Modal>

      {/* Stone Modal */}
      <Modal open={stoneDraft !== null} title={stoneDraft?.index === null ? "Add Stone" : "Edit Stone"} submitLabel={stoneDraft?.index === null ? "Add" : "Save"} onClose={() => setStoneDraft(null)} onSubmit={saveStone}>
        {stoneDraft && (<>
          <div><label className="form-label">Stone ID</label><input type="text" className="form-input" autoFocus value={stoneDraft.item.stoneId} onChange={(e) => setStoneField("stoneId", e.target.value)} /></div>
          <div><label className="form-label">Shape</label><input type="text" className="form-input" value={stoneDraft.item.shape} onChange={(e) => setStoneField("shape", e.target.value)} /></div>
          <div><label className="form-label">Type</label><input type="text" className="form-input" value={stoneDraft.item.type} onChange={(e) => setStoneField("type", e.target.value)} /></div>
          <div><label className="form-label">Desc</label><input type="text" className="form-input" value={stoneDraft.item.desc} onChange={(e) => setStoneField("desc", e.target.value)} /></div>
          <div><label className="form-label">Size</label><input type="text" className="form-input" value={stoneDraft.item.size} onChange={(e) => setStoneField("size", e.target.value)} /></div>
          <div><label className="form-label">Pcs</label><input type="number" step="1" min="0" required className="form-input" value={stoneDraft.item.pcs || ""} onChange={(e) => setStoneField("pcs", parseInt(e.target.value) || 0)} /></div>
          <div><label className="form-label">Weight (Cts)</label><input type="number" step="any" min="0" required className="form-input" value={stoneDraft.item.weight || ""} onChange={(e) => setStoneField("weight", parseFloat(e.target.value) || 0)} /></div>
          <div><label className="form-label">Price / Ct ({currSymbol})</label><input type="number" step="any" min="0" required className="form-input" value={stoneDraft.item.pricePerCt || ""} onChange={(e) => setStoneField("pricePerCt", parseFloat(e.target.value) || 0)} /></div>
          <div className="col-span-2 flex justify-between border-t pt-3 text-sm"><span className="text-gray-500">Amount</span><span className="font-semibold">{currSymbol} {stoneDraftAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
        </>)}
      </Modal>
    </div>
  );
}
