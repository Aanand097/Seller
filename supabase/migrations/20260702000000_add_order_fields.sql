ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS account_details text;
