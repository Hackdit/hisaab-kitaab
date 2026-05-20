-- INVOICE LINE ITEMS
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description TEXT NOT NULL,
  hsn_code TEXT,
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT 'pcs',
  rate NUMERIC(10,2) NOT NULL,
  gst_rate NUMERIC(4,2) DEFAULT 18,
  amount NUMERIC(12,2) NOT NULL
);

-- TRANSACTIONS (payments, udhaar, receipts)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  invoice_id UUID REFERENCES invoices(id),
  type TEXT CHECK (type IN ('payment_in','payment_out','udhaar','adjustment')),
  amount NUMERIC(12,2) NOT NULL,
  payment_mode TEXT CHECK (payment_mode IN ('upi','cash','bank','credit','other')),
  upi_reference TEXT,
  notes TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);