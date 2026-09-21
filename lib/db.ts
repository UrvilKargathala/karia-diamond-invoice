import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { StoredInvoice } from "./types";

async function getDb() {
  const { env } = await getCloudflareContext();
  return (env as unknown as { DB: D1Database }).DB;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean }>;
}

function rowToInvoice(row: Record<string, unknown>): StoredInvoice {
  return {
    id: row.id as string,
    type: row.type as "domestic" | "export",
    invoiceNo: row.invoice_no as string,
    date: row.date as string,
    buyerName: row.buyer_name as string,
    totalAmount: row.total_amount as number,
    currency: row.currency as string,
    createdAt: row.created_at as string,
    data: JSON.parse(row.data as string),
  } as StoredInvoice;
}

export async function getAllInvoices(): Promise<StoredInvoice[]> {
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT * FROM invoices ORDER BY created_at DESC")
    .all();
  return results.map(rowToInvoice);
}

export async function getInvoiceById(
  id: string
): Promise<StoredInvoice | undefined> {
  const db = await getDb();
  const row = await db.prepare("SELECT * FROM invoices WHERE id = ?").bind(id).first();
  return row ? rowToInvoice(row) : undefined;
}

export async function saveInvoice(invoice: StoredInvoice): Promise<void> {
  const db = await getDb();
  await db
    .prepare(
      "INSERT INTO invoices (id, type, invoice_no, date, buyer_name, total_amount, currency, created_at, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      invoice.id,
      invoice.type,
      invoice.invoiceNo,
      invoice.date,
      invoice.buyerName,
      invoice.totalAmount,
      invoice.currency,
      invoice.createdAt,
      JSON.stringify(invoice.data)
    )
    .run();
}

export async function updateInvoice(
  id: string,
  invoice: StoredInvoice
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .prepare(
      "UPDATE invoices SET type = ?, invoice_no = ?, date = ?, buyer_name = ?, total_amount = ?, currency = ?, data = ? WHERE id = ?"
    )
    .bind(
      invoice.type,
      invoice.invoiceNo,
      invoice.date,
      invoice.buyerName,
      invoice.totalAmount,
      invoice.currency,
      JSON.stringify(invoice.data),
      id
    )
    .run();
  return result.success;
}

export async function deleteInvoice(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.prepare("DELETE FROM invoices WHERE id = ?").bind(id).run();
  return result.success;
}

export async function getNextInvoiceNumber(
  type: "domestic" | "export"
): Promise<string> {
  const db = await getDb();
  const year = new Date().getFullYear();
  const nextYear = year + 1;
  const yearSuffix = `${String(year).slice(2)}-${String(nextYear).slice(2)}`;

  if (type === "domestic") {
    const row = await db
      .prepare("SELECT invoice_no FROM invoices WHERE type = 'domestic' ORDER BY created_at DESC")
      .all();
    const nums = row.results.map((r) => {
      const match = (r.invoice_no as string).match(/DW(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `KT${yearSuffix}/DW${String(max + 1).padStart(4, "0")}`;
  } else {
    const row = await db
      .prepare("SELECT invoice_no FROM invoices WHERE type = 'export' ORDER BY created_at DESC")
      .all();
    const nums = row.results.map((r) => {
      const match = (r.invoice_no as string).match(/EXP\/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `BR/EXP/${String(max + 1).padStart(2, "0")}/${yearSuffix}`;
  }
}
