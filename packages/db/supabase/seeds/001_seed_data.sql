-- Seed data for Indian state codes (for CGST/SGST vs IGST logic)
INSERT INTO businesses (whatsapp_number, owner_name, business_name, gstin, address, state_code, language) VALUES
('+919876543210', 'Rajesh Kumar', 'Kirana Store', '27AAAAA0000A1Z5', 'Mumbai, Maharashtra', 'MH', 'hi'),
('+918765432109', 'Priya Sharma', 'General Store', '07BBBBB1111B2Z6', 'Delhi, Delhi', 'DL', 'en')
ON CONFLICT (whatsapp_number) DO NOTHING;

-- Seed data for HSN codes and GST rates (top 500 MSME products - simplified with a few examples)
-- We'll create a separate table for HSN codes if needed, but as per schema, HSN code is in products and invoice_items.
-- For simplicity, we can insert some sample products with HSN and GST rates.

-- Sample products for the first business
INSERT INTO products (business_id, name, hsn_code, unit, selling_price, cost_price, gst_rate, stock_quantity, low_stock_alert_at)
SELECT id, 'Rice', '1006', 'kg', 50.00, 40.00, 5.00, 100, 10 FROM businesses WHERE whatsapp_number = '+919876543210'
UNION ALL
SELECT id, 'Wheat Flour', '1101', 'kg', 30.00, 25.00, 5.00, 150, 20 FROM businesses WHERE whatsapp_number = '+919876543210'
UNION ALL
SELECT id, 'Toothpaste', '3306', 'pcs', 45.00, 35.00, 18.00, 200, 15 FROM businesses WHERE whatsapp_number = '+919876543210'
UNION ALL
SELECT id, 'Biscuits', '1905', 'pcs', 20.00, 15.00, 18.00, 300, 25 FROM businesses WHERE whatsapp_number = '+919876543210';

-- Sample products for the second business
INSERT INTO products (business_id, name, hsn_code, unit, selling_price, cost_price, gst_rate, stock_quantity, low_stock_alert_at)
SELECT id, 'Tea', '0902', 'kg', 200.00, 150.00, 5.00, 50, 5 FROM businesses WHERE whatsapp_number = '+918765432109'
UNION ALL
SELECT id, 'Sugar', '1701', 'kg', 40.00, 35.00, 5.00, 80, 10 FROM businesses WHERE whatsapp_number = '+918765432109'
UNION ALL
SELECT id, 'Milk', '0401', 'liter', 55.00, 45.00, 5.00, 120, 15 FROM businesses WHERE whatsapp_number = '+918765432109'
UNION ALL
SELECT id, 'Bread', '1905', 'pcs', 30.00, 25.00, 5.00, 100, 20 FROM businesses WHERE whatsapp_number = '+918765432109';

-- Note: In a real scenario, we would have a separate HSN master table, but for the scope of this project,
-- we are storing HSN and GST rate directly in products and invoice_items for simplicity.