-- Supabase Storage bucket for invoice PDFs
-- Run this in the Supabase SQL editor or via:
--   supabase storage create invoices --public
--
-- The bucket is also created lazily at runtime in invoice-flow.ts,
-- this migration ensures it exists as part of infra-as-code.

INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('invoices', 'invoices', true, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated businesses to read their own invoice PDFs
CREATE POLICY "Businesses can read own invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
