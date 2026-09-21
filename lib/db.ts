import type { StoredInvoice } from "./types";

const isCloudflare = process.env.NODE_ENV === "production" || !!process.env.CF_PAGES;

// --- File-based storage for local dev ---
import { promises as fs } from "fs";
import path from "path";
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "invoices.json");

async function readFile(): Promise<StoredInvoice[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeFile(invoices: StoredInvoice[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(invoices, null, 2));
}

// --- D1 (Cloudflare) ---
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean }>;
}

async function getDb(): Promise<D1Database> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext();
  return (env as unknown as { DB: D1Database }).DB;
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

// --- Unified API ---

export async function getAllInvoices(): Promise<StoredInvoice[]> {
  if (!isCloudflare) return readFile();
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT * FROM invoices ORDER BY created_at DESC")
    .all();
  return results.map(rowToInvoice);
}

export async function getInvoiceById(
  id: string
): Promise<StoredInvoice | undefined> {
  if (!isCloudflare) {
    const all = await readFile();
    return all.find((i) => i.id === id);
  }
  const db = await getDb();
  const row = await db.prepare("SELECT * FROM invoices WHERE id = ?").bind(id).first();
  return row ? rowToInvoice(row) : undefined;
}

export async function saveInvoice(invoice: StoredInvoice): Promise<void> {
  if (!isCloudflare) {
    const all = await readFile();
    all.unshift(invoice);
    await writeFile(all);
    return;
  }
  const db = await getDb();
  await db
    .prepare(
      "INSERT INTO invoices (id, type, invoice_no, date, buyer_name, total_amount, currency, created_at, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      invoice.id, invoice.type, invoice.invoiceNo, invoice.date,
      invoice.buyerName, invoice.totalAmount, invoice.currency,
      invoice.createdAt, JSON.stringify(invoice.data)
    )
    .run();
}

export async function updateInvoice(
  id: string,
  invoice: StoredInvoice
): Promise<boolean> {
  if (!isCloudflare) {
    const all = await readFile();
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    all[idx] = invoice;
    await writeFile(all);
    return true;
  }
  const db = await getDb();
  const result = await db
    .prepare(
      "UPDATE invoices SET type = ?, invoice_no = ?, date = ?, buyer_name = ?, total_amount = ?, currency = ?, data = ? WHERE id = ?"
    )
    .bind(
      invoice.type, invoice.invoiceNo, invoice.date, invoice.buyerName,
      invoice.totalAmount, invoice.currency, JSON.stringify(invoice.data), id
    )
    .run();
  return result.success;
}

export async function deleteInvoice(id: string): Promise<boolean> {
  if (!isCloudflare) {
    const all = await readFile();
    const filtered = all.filter((i) => i.id !== id);
    if (filtered.length === all.length) return false;
    await writeFile(filtered);
    return true;
  }
  const db = await getDb();
  const result = await db.prepare("DELETE FROM invoices WHERE id = ?").bind(id).run();
  return result.success;
}

export async function getNextInvoiceNumber(
  type: "domestic" | "export"
): Promise<string> {
  const year = new Date().getFullYear();
  const nextYear = year + 1;
  const yearSuffix = `${String(year).slice(2)}-${String(nextYear).slice(2)}`;

  if (!isCloudflare) {
    const all = await readFile();
    const filtered = all.filter((i) => i.type === type);
    if (type === "domestic") {
      const nums = filtered.map((r) => {
        const match = r.invoiceNo.match(/DW(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      return `KT${yearSuffix}/DW${String(max + 1).padStart(4, "0")}`;
    } else {
      const nums = filtered.map((r) => {
        const match = r.invoiceNo.match(/EXP\/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      return `BR/EXP/${String(max + 1).padStart(2, "0")}/${yearSuffix}`;
    }
  }

  const db = await getDb();
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
