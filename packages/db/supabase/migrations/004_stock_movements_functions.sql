-- STOCK MOVEMENTS
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  product_id UUID REFERENCES products(id),
  movement_type TEXT CHECK (movement_type IN ('in','out','adjustment')),
  quantity NUMERIC(10,2) NOT NULL,
  reference_id UUID,  -- invoice_id or purchase_id
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update product stock quantity
CREATE OR REPLACE FUNCTION update_product_stock(
  p_product_id UUID,
  p_quantity NUMERIC(10,2),
  p_movement_type TEXT
) RETURNS VOID AS $$
DECLARE
  v_current_stock NUMERIC(10,2);
  v_new_stock NUMERIC(10,2);
BEGIN
  -- Get current stock
  SELECT stock_quantity INTO v_current_stock
  FROM products
  WHERE id = p_product_id;

  -- Calculate new stock based on movement type
  CASE p_movement_type
    WHEN 'in' THEN
      v_new_stock := v_current_stock + p_quantity;
    WHEN 'out' THEN
      v_new_stock := v_current_stock - p_quantity;
    WHEN 'adjustment' THEN
      v_new_stock := p_quantity;
    ELSE
      RAISE EXCEPTION 'Invalid movement type: %', p_movement_type;
  END CASE;

  -- Update stock quantity
  UPDATE products
  SET stock_quantity = v_new_stock
  WHERE id = p_product_id;

  -- Ensure stock doesn't go negative (optional - add constraint if needed)
  IF v_new_stock < 0 THEN
    RAISE NOTICE 'Stock quantity has gone negative for product %', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;