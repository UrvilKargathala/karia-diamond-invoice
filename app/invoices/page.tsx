"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Trash2,
  Download,
  Globe,
  FilePlus,
  Pencil,
  Copy,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/toast";
import type { StoredInvoice } from "@/lib/types";

const PAGE_SIZE = 15;

export default function InvoiceHistoryPage() {
  const router = useRouter();
  const toast = useToast();
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "domestic" | "export">(
    "all"
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchInvoices = () => {
    setLoading(true);
    fetch("/api/invoices")
      .then((r) => r.json())
      .then(setInvoices)
      .catch(() => toast("Failed to load invoices", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = invoices.filter((inv) => {
    if (typeFilter !== "all" && inv.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !inv.invoiceNo.toLowerCase().includes(q) &&
        !inv.buyerName.toLowerCase().includes(q)
      )
        return false;
    }
    if (dateFrom && inv.date < dateFrom) return false;
    if (dateTo && inv.date > dateTo) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, dateFrom, dateTo]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Invoice deleted", "success");
        fetchInvoices();
      } else {
        toast("Failed to delete", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (inv: StoredInvoice) => {
    if (inv.type === "domestic") {
      const { generateDomesticPdf } = await import("@/lib/pdf-domestic");
      const pdf = generateDomesticPdf(inv.data);
      pdf.save(`${inv.invoiceNo.replace(/\//g, "_")}.pdf`);
    } else {
      const { generateExportPdf } = await import("@/lib/pdf-export");
      const pdf = generateExportPdf(inv.data);
      pdf.save(`${inv.invoiceNo.replace(/\//g, "_")}.pdf`);
    }
    toast("PDF downloaded", "info");
  };

  const handlePreview = async (inv: StoredInvoice) => {
    if (inv.type === "domestic") {
      const { generateDomesticPdf } = await import("@/lib/pdf-domestic");
      const pdf = generateDomesticPdf(inv.data);
      window.open(pdf.output("bloburl") as unknown as string, "_blank");
    } else {
      const { generateExportPdf } = await import("@/lib/pdf-export");
      const pdf = generateExportPdf(inv.data);
      window.open(pdf.output("bloburl") as unknown as string, "_blank");
    }
  };

  const handleEdit = (inv: StoredInvoice) => {
    const base =
      inv.type === "domestic" ? "/create/domestic" : "/create/export";
    router.push(`${base}?id=${inv.id}`);
  };

  const handleClone = (inv: StoredInvoice) => {
    const base =
      inv.type === "domestic" ? "/create/domestic" : "/create/export";
    router.push(`${base}?clone=${inv.id}`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoice History</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}{" "}
            {filtered.length !== invoices.length &&
              `(of ${invoices.length} total)`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/create/domestic")}
            className="btn btn-outline"
          >
            <FilePlus size={14} />
            <span className="hidden sm:inline">Domestic</span>
          </button>
          <button
            onClick={() => router.push("/create/export")}
            className="btn btn-primary"
          >
            <Globe size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              className="form-input pl-9"
              placeholder="Search by invoice number or buyer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input w-36"
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | "domestic" | "export")
            }
          >
            <option value="all">All Types</option>
            <option value="domestic">Domestic</option>
            <option value="export">Export</option>
          </select>
          <div>
            <label className="form-label">From</label>
            <input
              type="date"
              className="form-input w-36"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">To</label>
            <input
              type="date"
              className="form-input w-36"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="btn btn-outline text-xs"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            {invoices.length === 0
              ? "No invoices yet. Create your first invoice above."
              : "No invoices match your filters."}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 font-medium">Invoice No.</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Buyer</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="py-3 font-mono text-xs">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            inv.type === "domestic"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          {inv.type}
                        </span>
                      </td>
                      <td className="py-3">{inv.buyerName}</td>
                      <td className="py-3 text-gray-500">
                        {new Date(inv.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {inv.currency === "INR" ? "₹" : "$"}{" "}
                        {inv.totalAmount.toLocaleString(
                          inv.currency === "INR" ? "en-IN" : "en-US",
                          { minimumFractionDigits: 0 }
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-0.5 justify-end">
                          <button
                            onClick={() => handlePreview(inv)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50"
                            title="Preview PDF"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDownload(inv)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => handleEdit(inv)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 rounded hover:bg-amber-50"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleClone(inv)}
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            disabled={deleting === inv.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <span className="text-xs text-gray-500">
                  Page {safePage} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="btn btn-outline py-1 px-2 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={safePage >= totalPages}
                    className="btn btn-outline py-1 px-2 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
