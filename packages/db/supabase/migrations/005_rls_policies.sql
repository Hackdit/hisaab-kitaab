-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Businesses can access own data
CREATE POLICY "Businesses can access own data" ON businesses
  FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Customers can only access business's data" ON customers
  FOR ALL USING (auth.uid()::text = business_id::text);

CREATE POLICY "Products can only access business's data" ON products
  FOR ALL USING (auth.uid()::text = business_id::text);

CREATE POLICY "Invoices can only access business's data" ON invoices
  FOR ALL USING (auth.uid()::text = business_id::text);

CREATE POLICY "Invoice items can only access business's data" ON invoice_items
  FOR ALL USING (invoice_id IN (SELECT id FROM invoices WHERE business_id = auth.uid()));

CREATE POLICY "Transactions can only access business's data" ON transactions
  FOR ALL USING (auth.uid()::text = business_id::text);

CREATE POLICY "Stock movements can only access business's data" ON stock_movements
  FOR ALL USING (auth.uid()::text = business_id::text);