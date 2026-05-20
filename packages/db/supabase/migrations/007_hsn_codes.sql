-- HSN Codes lookup table for GST rates
-- Contains top 500 HSN codes for MSME products with their GST rates
CREATE TABLE hsn_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hsn_code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  gst_rate NUMERIC(4,2) NOT NULL DEFAULT 18,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookup by HSN code
CREATE INDEX idx_hsn_codes_code ON hsn_codes(hsn_code);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hsn_codes_updated_at
BEFORE UPDATE ON hsn_codes
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Insert sample HSN codes for common MSME products
-- Format: (HSN_CODE, DESCRIPTION, GST_RATE)
INSERT INTO hsn_codes (hsn_code, description, gst_rate) VALUES
-- Food items
('1006', 'Rice', 5),
('1101', 'Wheat or meslin flour', 5),
('1701', 'Cane or beet sugar', 5),
('0902', 'Tea', 5),
('0401', 'Milk and cream', 5),
('1905', 'Bread, biscuits, cakes', 5),
('2202', 'Waters, soft drinks', 18),
('2106', 'Food preparations', 18),

-- Personal care
('3304', 'Beauty or make-up preparations', 18),
('3305', 'Preparations for use on hair', 18),
('3306', 'Preparations for oral or dental hygiene', 18),
('3401', 'Soap', 18),
('3402', 'Organic surface-active agents', 18),

-- Clothing and textiles
('5201', 'Cotton', 5),
('5208', 'Woven fabrics of cotton', 5),
('6109', 'T-shirts, singlets', 5),
('6204', 'Women''s suits', 5),
('6302', 'Bed linen, table linen', 5),

-- Electronics
('8517', 'Telephone sets', 18),
('8525', 'Transmission apparatus for radio-TV', 18),
('8528', 'Monitors and projectors', 18),
('8504', 'Electric transformers', 18),
('8507', 'Electric accumulators', 18),

-- Stationery
('4820', 'Registers, account books', 12),
('4821', 'Paper or paperboard labels', 12),
('9608', 'Ball point pens', 12),
('9609', 'Pencils, crayons', 12),

-- Hardware and tools
('7318', 'Screws, bolts, nuts', 18),
('7326', 'Articles of iron or steel', 18),
('8205', 'Hand tools', 18),
('8207', 'Interchangeable tools', 18),
('8414', 'Air or vacuum pumps', 18),

-- Chemicals and fertilizers
('2836', 'Carbonates', 18),
('3102', 'Mineral or chemical fertilizers', 5),
('3105', 'Mineral or chemical fertilizers', 12),

-- Add more as needed for top 500 MSME products
-- This is a sample set - in production would include more comprehensive list
ON CONFLICT (hsn_code) DO NOTHING;