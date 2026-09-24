import { NextResponse } from "next/server";
import { getMemoById, updateMemo, deleteMemo } from "@/lib/db";
import type { ConsignmentMemo, CompanyInfo, MemoLineItem, MemoStatus } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const memo = await getMemoById(id);
  if (!memo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(memo);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getMemoById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { date, buyer, items, status, invoiceId } = body as {
    date?: string;
    buyer?: CompanyInfo;
    items?: MemoLineItem[];
    status?: MemoStatus;
    invoiceId?: string;
  };

  const updated: ConsignmentMemo = {
    ...existing,
    date: date ?? existing.date,
    buyer: buyer ?? existing.buyer,
    items: items ?? existing.items,
    totalAmount: items ? items.reduce((s, i) => s + i.amount, 0) : existing.totalAmount,
    status: status ?? existing.status,
    invoiceId: invoiceId ?? existing.invoiceId,
    updatedAt: new Date().toISOString(),
  };

  const success = await updateMemo(id, updated);
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
  const deleted = await deleteMemo(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
