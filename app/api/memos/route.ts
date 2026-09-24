import { NextResponse } from "next/server";
import { getAllMemos, saveMemo, getNextMemoNumber } from "@/lib/db";
import type { ConsignmentMemo, CompanyInfo, MemoLineItem } from "@/lib/types";
import { generateId } from "@/lib/utils";

export async function GET() {
  const memos = await getAllMemos();
  return NextResponse.json(memos);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { type, date, currency, buyer, items } = body as {
    type: "domestic" | "export";
    date: string;
    currency?: string;
    buyer: CompanyInfo;
    items: MemoLineItem[];
  };

  const memoNo = await getNextMemoNumber(type);
  const totalAmount = items.reduce((s, i) => s + i.amount, 0);
  const now = new Date().toISOString();

  const memo: ConsignmentMemo = {
    id: generateId(),
    memoNo,
    type,
    date,
    currency: type === "domestic" ? "INR" : currency || "USD",
    buyer,
    items,
    totalAmount,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await saveMemo(memo);
  return NextResponse.json(memo, { status: 201 });
}
