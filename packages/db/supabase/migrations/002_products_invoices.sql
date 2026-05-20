-- PRODUCTS/INVENTORY
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hsn_code TEXT,
  unit TEXT DEFAULT 'pcs',
  selling_price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  gst_rate NUMERIC(4,2) DEFAULT 18,
  stock_quantity NUMERIC(10,2) DEFAULT 0,
  low_stock_alert_at NUMERIC(10,2) DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVOICES
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  invoice_number TEXT NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(12,2) NOT NULL,
  cgst NUMERIC(12,2) DEFAULT 0,
  sgst NUMERIC(12,2) DEFAULT 0,
  igst NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  is_interstate BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('draft','sent','paid','partial','cancelled')),
  pdf_url TEXT,
  whatsapp_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, invoice_number)
);