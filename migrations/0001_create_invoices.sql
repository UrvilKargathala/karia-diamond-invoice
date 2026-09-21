CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  invoice_no TEXT NOT NULL,
  date TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
