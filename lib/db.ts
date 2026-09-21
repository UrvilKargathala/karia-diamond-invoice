import { promises as fs } from "fs";
import path from "path";
import type { StoredInvoice } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "invoices.json");
const LOCK_DIR = path.join(DATA_DIR, ".lock");

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let acquired = false;
  for (let i = 0; i < 20; i++) {
    try {
      await fs.mkdir(LOCK_DIR);
      acquired = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  if (!acquired) throw new Error("Database is busy, try again");
  try {
    return await fn();
  } finally {
    try {
      await fs.rmdir(LOCK_DIR);
    } catch {}
  }
}

async function readDb(): Promise<StoredInvoice[]> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeDb(invoices: StoredInvoice[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(invoices, null, 2), "utf-8");
}

export async function getAllInvoices(): Promise<StoredInvoice[]> {
  const invoices = await readDb();
  return invoices.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getInvoiceById(
  id: string
): Promise<StoredInvoice | undefined> {
  const invoices = await readDb();
  return invoices.find((inv) => inv.id === id);
}

export async function saveInvoice(invoice: StoredInvoice): Promise<void> {
  return withLock(async () => {
    const invoices = await readDb();
    invoices.push(invoice);
    await writeDb(invoices);
  });
}

export async function updateInvoice(
  id: string,
  invoice: StoredInvoice
): Promise<boolean> {
  return withLock(async () => {
    const invoices = await readDb();
    const idx = invoices.findIndex((inv) => inv.id === id);
    if (idx === -1) return false;
    invoices[idx] = invoice;
    await writeDb(invoices);
    return true;
  });
}

export async function deleteInvoice(id: string): Promise<boolean> {
  return withLock(async () => {
    const invoices = await readDb();
    const idx = invoices.findIndex((inv) => inv.id === id);
    if (idx === -1) return false;
    invoices.splice(idx, 1);
    await writeDb(invoices);
    return true;
  });
}

export async function getNextInvoiceNumber(
  type: "domestic" | "export"
): Promise<string> {
  const invoices = await readDb();
  const year = new Date().getFullYear();
  const nextYear = year + 1;
  const yearSuffix = `${String(year).slice(2)}-${String(nextYear).slice(2)}`;

  if (type === "domestic") {
    const nums = invoices
      .filter((i) => i.type === "domestic")
      .map((i) => {
        const match = i.invoiceNo.match(/DW(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `KT${yearSuffix}/DW${String(max + 1).padStart(4, "0")}`;
  } else {
    const nums = invoices
      .filter((i) => i.type === "export")
      .map((i) => {
        const match = i.invoiceNo.match(/EXP\/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `BR/EXP/${String(max + 1).padStart(2, "0")}/${yearSuffix}`;
  }
}
