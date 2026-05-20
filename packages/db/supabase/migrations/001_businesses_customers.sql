-- BUSINESSES (one per WhatsApp number)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_number TEXT UNIQUE NOT NULL,
  owner_name TEXT,
  business_name TEXT,
  gstin TEXT,
  address TEXT,
  state_code CHAR(2),  -- For CGST/SGST vs IGST logic
  logo_url TEXT,
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial','chhota','vyapari','dhanda','ca')),
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  razorpay_subscription_id TEXT,
  language TEXT DEFAULT 'hi' CHECK (language IN ('hi','ta','te','bn','kn','en')),
  onboarded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOMERS (auto-created from WhatsApp interactions)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  whatsapp_number TEXT,
  gstin TEXT,
  address TEXT,
  total_outstanding NUMERIC(12,2) DEFAULT 0,
  last_transaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, whatsapp_number)
);