import { NextResponse } from "next/server";
import {
  getInvoiceById,
  deleteInvoice,
  updateInvoice,
} from "@/lib/db";
import type {
  StoredInvoice,
  DomesticInvoiceData,
  ExportInvoiceData,
} from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(invoice);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getInvoiceById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { type, data } = body as {
    type: "domestic" | "export";
    data: DomesticInvoiceData | ExportInvoiceData;
  };

  let buyerName = "";
  let totalAmount = 0;
  let currency = "INR";

  if (type === "domestic") {
    const d = data as DomesticInvoiceData;
    buyerName = d.buyer.name;
    const subtotal = d.items.reduce((s, i) => s + i.amount, 0);
    const tax = d.isInterState
      ? subtotal * (d.igstRate / 100)
      : subtotal * (d.cgstRate / 100) + subtotal * (d.sgstRate / 100);
    totalAmount = Math.round(subtotal + tax);
  } else {
    const e = data as ExportInvoiceData;
    buyerName = e.consignee.name;
    totalAmount =
      e.items.reduce((s, i) => s + i.amount, 0) + e.shippingCharges;
    currency = e.currency || "USD";
  }

  const updated = {
    ...existing,
    type,
    invoiceNo: data.invoiceNo,
    date: data.date,
    buyerName,
    totalAmount,
    currency,
    data,
  } as StoredInvoice;

  const success = await updateInvoice(id, updated);
  if (!success) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteInvoice(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
