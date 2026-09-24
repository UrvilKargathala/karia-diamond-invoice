"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Undo2,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { SlideOver } from "@/components/slide-over";
import { useToast } from "@/components/toast";
import { TableSkeleton } from "@/components/skeleton";
import { HSN_CODES } from "@/lib/constants";
import type { ConsignmentMemo, MemoLineItem, MemoStatus, CompanyInfo } from "@/lib/types";

const emptyBuyer: CompanyInfo = { name: "", address: "", gstin: "" };
const emptyItem: MemoLineItem = {
  slNo: 1,
  description: "Rough Diamond",
  hsnCode: "71049110",
  quantity: 0,
  unit: "Pcs",
  rate: 0,
  amount: 0,
};

const statusStyles: Record<MemoStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  sold: "bg-green-50 text-green-700",
  returned: "bg-gray-100 text-gray-600",
};

export default function MemosPage() {
  const router = useRouter();
  const toast = useToast();
  const [memos, setMemos] = useState<ConsignmentMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<MemoStatus | "all">("all");

  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [type, setType] = useState<"domestic" | "export">("domestic");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState("USD");
  const [buyer, setBuyer] = useState<CompanyInfo>({ ...emptyBuyer });
  const [items, setItems] = useState<MemoLineItem[]>([]);
  const [draft, setDraft] = useState<{ index: number | null; item: MemoLineItem } | null>(null);

  const fetchMemos = () => {
    setLoading(true);
    fetch("/api/memos")
      .then((r) => r.json())
      .then(setMemos)
      .catch(() => toast("Failed to load memos", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchMemos, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(
    () => (statusFilter === "all" ? memos : memos.filter((m) => m.status === statusFilter)),
    [memos, statusFilter]
  );

  const resetForm = () => {
    setEditId(null);
    setType("domestic");
    setDate(new Date().toISOString().slice(0, 10));
    setCurrency("USD");
    setBuyer({ ...emptyBuyer });
    setItems([]);
    setDraft(null);
  };

  const openNew = () => {
    resetForm();
    setPanelOpen(true);
  };

  const openEdit = (memo: ConsignmentMemo) => {
    setEditId(memo.id);
    setType(memo.type);
    setDate(memo.date);
    setCurrency(memo.currency);
    setBuyer(memo.buyer);
    setItems(memo.items);
    setPanelOpen(true);
  };

  const setDraftField = (field: keyof MemoLineItem, value: string | number) =>
    setDraft((d) => d && { ...d, item: { ...d.item, [field]: value } });

  const draftAmount = draft ? +(draft.item.quantity * draft.item.rate).toFixed(2) : 0;

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

  const totalAmount = items.reduce((s, i) => s + i.amount, 0);

  const handleSubmit = async () => {
    if (!buyer.name.trim()) {
      toast("Buyer name is required", "error");
      return;
    }
    if (items.length === 0) {
      toast("Add at least one item", "error");
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/memos/${editId}` : "/api/memos";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, date, currency, buyer, items }),
      });
      if (res.ok) {
        toast(editId ? "Memo updated" : "Memo created", "success");
        setPanelOpen(false);
        fetchMemos();
      } else {
        toast("Failed to save memo", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = (memo: ConsignmentMemo) => {
    router.push(`/create/${memo.type}?fromMemo=${memo.id}`);
  };

  const handleReturn = async (memo: ConsignmentMemo) => {
    if (!confirm(`Mark memo ${memo.memoNo} as returned? Goods were not sold.`)) return;
    try {
      const res = await fetch(`/api/memos/${memo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "returned" }),
      });
      if (res.ok) {
        toast("Memo marked returned", "success");
        fetchMemos();
      } else toast("Failed to update memo", "error");
    } catch {
      toast("Something went wrong", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this memo? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/memos/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Memo deleted", "success");
        fetchMemos();
      } else toast("Failed to delete", "error");
    } catch {
      toast("Something went wrong", "error");
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const fmtAmount = (m: ConsignmentMemo) =>
    `${m.currency === "INR" ? "₹" : m.currency + " "} ${m.totalAmount.toLocaleString("en-IN")}`;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList size={24} /> Memo
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Goods sent on approval — pending, sold, or returned
          </p>
        </div>
        <button onClick={openNew} className="btn btn-primary">
          <Plus size={14} /> New Memo
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "pending", "sold", "returned"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              statusFilter === s
                ? "bg-[#1a1a2e] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card">
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">
            No memos {statusFilter !== "all" ? `with status "${statusFilter}"` : "yet"}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Memo No.</th>
                  <th className="pb-2 font-medium">Buyer</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((memo) => (
                  <tr key={memo.id} className="border-b last:border-0">
                    <td className="py-3 font-mono text-xs">{memo.memoNo}</td>
                    <td className="py-3">{memo.buyer.name}</td>
                    <td className="py-3 text-gray-500">{fmtDate(memo.date)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[memo.status]}`}>
                        {memo.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium">{fmtAmount(memo)}</td>
                    <td className="py-3 text-right">
                      <div className="flex gap-0.5 justify-end">
                        {memo.status === "pending" && (
                          <>
                            <button onClick={() => handleConvert(memo)} className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50" title="Convert to Invoice">
                              <ArrowRightLeft size={14} />
                            </button>
                            <button onClick={() => handleReturn(memo)} className="p-1.5 text-gray-400 hover:text-amber-600 rounded hover:bg-amber-50" title="Mark Returned">
                              <Undo2 size={14} />
                            </button>
                            <button onClick={() => openEdit(memo)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50" title="Edit">
                              <Pencil size={14} />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(memo.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Panel */}
      <SlideOver open={panelOpen} title={editId ? "Edit Memo" : "New Memo"} onClose={() => setPanelOpen(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type</label>
              <select className="form-input" value={type} onChange={(e) => setType(e.target.value as "domestic" | "export")}>
                <option value="domestic">Domestic</option>
                <option value="export">Export</option>
              </select>
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {type === "export" && (
            <div>
              <label className="form-label">Currency</label>
              <select className="form-input w-36" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option>USD</option><option>EUR</option><option>GBP</option><option>AED</option><option>HKD</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Buyer Name</label>
              <input type="text" className="form-input" value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} />
            </div>
            <div>
              <label className="form-label">GSTIN (if domestic)</label>
              <input type="text" className="form-input" value={buyer.gstin || ""} onChange={(e) => setBuyer({ ...buyer, gstin: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Address</label>
              <textarea className="form-input" rows={2} value={buyer.address} onChange={(e) => setBuyer({ ...buyer, address: e.target.value })} />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Items</label>
              <button onClick={() => setDraft({ index: null, item: { ...emptyItem } })} className="btn btn-primary text-xs">
                <Plus size={12} /> Add Item
              </button>
            </div>
            {items.length > 0 ? (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="p-2 w-8">#</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 w-14"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="p-2 text-gray-400">{item.slNo}</td>
                        <td className="p-2">{item.description}</td>
                        <td className="p-2 text-right">{item.quantity} {item.unit}</td>
                        <td className="p-2 text-right">{item.rate.toLocaleString()}</td>
                        <td className="p-2 text-right font-medium">{item.amount.toLocaleString()}</td>
                        <td className="p-2 text-right whitespace-nowrap">
                          <button onClick={() => setDraft({ index: idx, item: { ...item } })} className="text-gray-400 hover:text-gray-700 p-1"><Pencil size={12} /></button>
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center border rounded-lg">No items added yet.</p>
            )}
            {items.length > 0 && (
              <div className="flex justify-end mt-2 text-sm font-semibold">
                Total: {currency === "INR" || type === "domestic" ? "₹" : currency} {totalAmount.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-end border-t pt-4 mt-6">
          <button onClick={() => setPanelOpen(false)} className="btn btn-outline">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn btn-primary disabled:opacity-50">
            {saving ? "Saving..." : editId ? "Update Memo" : "Create Memo"}
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
            <div className="col-span-2 text-right text-sm text-gray-500">
              Amount: <span className="font-semibold text-gray-900">{draftAmount.toLocaleString()}</span>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
