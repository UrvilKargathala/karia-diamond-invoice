import { NextResponse } from "next/server";
import { getAllInvoices, saveInvoice, getNextInvoiceNumber } from "@/lib/db";
import type { StoredInvoice, DomesticInvoiceData, ExportInvoiceData } from "@/lib/types";
import { generateId } from "@/lib/utils";

export async function GET() {
  const invoices = await getAllInvoices();
  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { type, data } = body as {
    type: "domestic" | "export";
    data: DomesticInvoiceData | ExportInvoiceData;
  };

  const invoiceNo =
    data.invoiceNo || (await getNextInvoiceNumber(type));

  const updatedData = { ...data, invoiceNo };

  let buyerName = "";
  let totalAmount = 0;
  let currency = "INR";

  if (type === "domestic") {
    const d = updatedData as DomesticInvoiceData;
    buyerName = d.buyer.name;
    const subtotal = d.items.reduce((s, i) => s + i.amount, 0);
    const tax = d.isInterState
      ? subtotal * (d.igstRate / 100)
      : subtotal * (d.cgstRate / 100) + subtotal * (d.sgstRate / 100);
    totalAmount = Math.round(subtotal + tax);
  } else {
    const e = updatedData as ExportInvoiceData;
    buyerName = e.consignee.name;
    totalAmount =
      e.items.reduce((s, i) => s + i.amount, 0) + e.shippingCharges;
    currency = "USD";
  }

  // body pairs `type` with matching `data`; TS can't correlate the two here
  const stored = {
    id: generateId(),
    type,
    invoiceNo,
    date: data.date,
    buyerName,
    totalAmount,
    currency,
    createdAt: new Date().toISOString(),
    data: updatedData,
  } as StoredInvoice;

  await saveInvoice(stored);
  return NextResponse.json(stored, { status: 201 });
}
