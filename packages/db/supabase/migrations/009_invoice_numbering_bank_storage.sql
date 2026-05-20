-- Add invoice sequencing and bank details to businesses
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS last_invoice_sequence INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bank_account TEXT,
  ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- Add customer_id to invoices (for proper referential integrity)
-- This column already exists but may not be populated by older flows
-- No migration needed for existing column

-- Create Supabase storage bucket for invoice PDFs
-- (Run via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true);
--
-- Storage RLS: authenticated businesses can read their own invoices
-- CREATE POLICY "Businesses can read own invoices" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'invoices' AND
--     (storage.foldername(name))[2] = auth.uid()::text
--   );
--
-- CREATE POLICY "Businesses can upload own invoices" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'invoices' AND
--     (storage.foldername(name))[2] = auth.uid()::text
--   );