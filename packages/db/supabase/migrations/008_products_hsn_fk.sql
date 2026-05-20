-- Add foreign key constraint from products to hsn_codes
-- and create function to get GST rate from HSN code

-- First, add the foreign key constraint to products table
ALTER TABLE products
ADD CONSTRAINT fk_products_hsn_code
FOREIGN KEY (hsn_code)
REFERENCES hsn_codes(hsn_code)
ON DELETE SET NULL;

-- Create function to get GST rate from HSN code
CREATE OR REPLACE FUNCTION get_gst_rate_from_hsn(p_hsn_code TEXT)
RETURNS NUMERIC(4,2) AS $$
DECLARE
  v_gst_rate NUMERIC(4,2);
BEGIN
  SELECT gst_rate INTO v_gst_rate
  FROM hsn_codes
  WHERE hsn_code = p_hsn_code
  AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  AND effective_from <= CURRENT_DATE
  LIMIT 1;

  IF v_gst_rate IS NULL THEN
    -- Return default GST rate if not found
    v_gst_rate := 18;
  END IF;

  RETURN v_gst_rate;
END;
$$ LANGUAGE plpgsql;

-- Update existing products to ensure they have valid HSN codes
-- (This is a safety update - in practice, seed data should already be valid)
UPDATE products p
SET hsn_code = COALESCE(
  (SELECT hsn_code FROM hsn_codes WHERE hsn_code = p.hsn_code LIMIT 1),
  '1006'  -- Default to rice HSN code if not found
)
WHERE hsn_code IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM hsn_codes h WHERE h.hsn_code = p.hsn_code
);

-- Create index on hsn_code for products table for faster joins
CREATE INDEX idx_products_hsn_code ON products(hsn_code);