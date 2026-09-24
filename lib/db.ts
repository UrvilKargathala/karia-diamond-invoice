import type { StoredInvoice, Note, ConsignmentMemo } from "./types";

const isCloudflare = process.env.NODE_ENV === "production" || !!process.env.CF_PAGES;

// --- File-based storage for local dev ---
import { promises as fs } from "fs";
import path from "path";
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "invoices.json");
const NOTES_FILE = path.join(DATA_DIR, "notes.json");
const MEMOS_FILE = path.join(DATA_DIR, "consignment-memos.json");

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

async function readNotesFile(): Promise<Note[]> {
  try {
    const raw = await fs.readFile(NOTES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeNotesFile(notes: Note[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2));
}

async function readConsignmentMemosFile(): Promise<ConsignmentMemo[]> {
  try {
    const raw = await fs.readFile(MEMOS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeConsignmentMemosFile(memos: ConsignmentMemo[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(MEMOS_FILE, JSON.stringify(memos, null, 2));
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

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    pinned: !!row.pinned,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToConsignmentMemo(row: Record<string, unknown>): ConsignmentMemo {
  const extra = JSON.parse(row.data as string) as Pick<ConsignmentMemo, "buyer" | "items" | "totalAmount">;
  return {
    ...extra,
    id: row.id as string,
    memoNo: row.memo_no as string,
    type: row.type as "domestic" | "export",
    date: row.date as string,
    currency: row.currency as string,
    status: row.status as ConsignmentMemo["status"],
    invoiceId: (row.invoice_id as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
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

// --- Notes ---

export async function getAllNotes(): Promise<Note[]> {
  if (!isCloudflare) {
    const all = await readNotesFile();
    return all.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC")
    .all();
  return results.map(rowToNote);
}

export async function saveNote(note: Note): Promise<void> {
  if (!isCloudflare) {
    const all = await readNotesFile();
    all.unshift(note);
    await writeNotesFile(all);
    return;
  }
  const db = await getDb();
  await db
    .prepare(
      "INSERT INTO notes (id, title, content, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(note.id, note.title, note.content, note.pinned ? 1 : 0, note.createdAt, note.updatedAt)
    .run();
}

export async function updateNote(id: string, note: Note): Promise<boolean> {
  if (!isCloudflare) {
    const all = await readNotesFile();
    const idx = all.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    all[idx] = note;
    await writeNotesFile(all);
    return true;
  }
  const db = await getDb();
  const result = await db
    .prepare(
      "UPDATE notes SET title = ?, content = ?, pinned = ?, updated_at = ? WHERE id = ?"
    )
    .bind(note.title, note.content, note.pinned ? 1 : 0, note.updatedAt, id)
    .run();
  return result.success;
}

export async function deleteNote(id: string): Promise<boolean> {
  if (!isCloudflare) {
    const all = await readNotesFile();
    const filtered = all.filter((n) => n.id !== id);
    if (filtered.length === all.length) return false;
    await writeNotesFile(filtered);
    return true;
  }
  const db = await getDb();
  const result = await db.prepare("DELETE FROM notes WHERE id = ?").bind(id).run();
  return result.success;
}

// --- Consignment Memos ---

export async function getAllMemos(): Promise<ConsignmentMemo[]> {
  if (!isCloudflare) {
    const all = await readConsignmentMemosFile();
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT * FROM consignment_memos ORDER BY created_at DESC")
    .all();
  return results.map(rowToConsignmentMemo);
}

export async function getMemoById(id: string): Promise<ConsignmentMemo | undefined> {
  if (!isCloudflare) {
    const all = await readConsignmentMemosFile();
    return all.find((m) => m.id === id);
  }
  const db = await getDb();
  const row = await db.prepare("SELECT * FROM consignment_memos WHERE id = ?").bind(id).first();
  return row ? rowToConsignmentMemo(row) : undefined;
}

export async function saveMemo(memo: ConsignmentMemo): Promise<void> {
  if (!isCloudflare) {
    const all = await readConsignmentMemosFile();
    all.unshift(memo);
    await writeConsignmentMemosFile(all);
    return;
  }
  const db = await getDb();
  const { buyer, items, totalAmount } = memo;
  await db
    .prepare(
      "INSERT INTO consignment_memos (id, memo_no, type, date, buyer_name, total_amount, currency, status, invoice_id, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      memo.id, memo.memoNo, memo.type, memo.date, memo.buyer.name,
      memo.totalAmount, memo.currency, memo.status, memo.invoiceId || null,
      memo.createdAt, memo.updatedAt, JSON.stringify({ buyer, items, totalAmount })
    )
    .run();
}

export async function updateMemo(id: string, memo: ConsignmentMemo): Promise<boolean> {
  if (!isCloudflare) {
    const all = await readConsignmentMemosFile();
    const idx = all.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    all[idx] = memo;
    await writeConsignmentMemosFile(all);
    return true;
  }
  const db = await getDb();
  const { buyer, items, totalAmount } = memo;
  const result = await db
    .prepare(
      "UPDATE consignment_memos SET buyer_name = ?, total_amount = ?, status = ?, invoice_id = ?, updated_at = ?, data = ? WHERE id = ?"
    )
    .bind(
      memo.buyer.name, memo.totalAmount, memo.status, memo.invoiceId || null,
      memo.updatedAt, JSON.stringify({ buyer, items, totalAmount }), id
    )
    .run();
  return result.success;
}

export async function deleteMemo(id: string): Promise<boolean> {
  if (!isCloudflare) {
    const all = await readConsignmentMemosFile();
    const filtered = all.filter((m) => m.id !== id);
    if (filtered.length === all.length) return false;
    await writeConsignmentMemosFile(filtered);
    return true;
  }
  const db = await getDb();
  const result = await db.prepare("DELETE FROM consignment_memos WHERE id = ?").bind(id).run();
  return result.success;
}

export async function getNextMemoNumber(type: "domestic" | "export"): Promise<string> {
  const year = new Date().getFullYear();
  const nextYear = year + 1;
  const yearSuffix = `${String(year).slice(2)}-${String(nextYear).slice(2)}`;

  const all = !isCloudflare
    ? await readConsignmentMemosFile()
    : (await (await getDb()).prepare("SELECT memo_no FROM consignment_memos WHERE type = ?").bind(type).all()).results.map(
        (r) => ({ memoNo: r.memo_no as string })
      );

  const filtered = (all as { memoNo: string }[]).filter((m) =>
    type === "domestic" ? m.memoNo.startsWith("KM") : m.memoNo.startsWith("BR/MEMO")
  );
  const pattern = type === "domestic" ? /KM\d{2}-\d{2}\/(\d+)/ : /MEMO\/(\d+)/;
  const nums = filtered.map((m) => {
    const match = m.memoNo.match(pattern);
    return match ? parseInt(match[1]) : 0;
  });
  const max = nums.length > 0 ? Math.max(...nums) : 0;

  return type === "domestic"
    ? `KM${yearSuffix}/${String(max + 1).padStart(4, "0")}`
    : `BR/MEMO/${String(max + 1).padStart(2, "0")}/${yearSuffix}`;
}
