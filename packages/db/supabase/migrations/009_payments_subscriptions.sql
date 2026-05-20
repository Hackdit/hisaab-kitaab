-- PAYMENTS & SUBSCRIPTIONS
-- Adds Razorpay fields to businesses and creates payment tracking tables

-- Add Razorpay customer ID to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;

-- Payment links generated for subscriptions
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  subscription_id TEXT NOT NULL,
  razorpay_link_id TEXT,
  short_url TEXT,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'created' CHECK (status IN ('created','sent','paid','expired')),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detailed payment transactions from webhook events
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_subscription_id TEXT,
  razorpay_order_id TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('captured','failed','refunded')),
  method TEXT,
  upi_id TEXT,
  bank_transaction_id TEXT,
  failure_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_businesses_razorpay_customer ON businesses(razorpay_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_business ON payment_links(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_subscription ON payment_links(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_business ON payment_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription ON payment_transactions(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON payment_transactions(invoice_id);