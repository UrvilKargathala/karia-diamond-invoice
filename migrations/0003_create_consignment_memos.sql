CREATE TABLE IF NOT EXISTS consignment_memos (
  id TEXT PRIMARY KEY,
  memo_no TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  invoice_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL
);
