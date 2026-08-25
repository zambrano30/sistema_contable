ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'cash';

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS cash_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS transfer_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;

UPDATE invoices
SET payment_method = 'cash'
WHERE payment_method IS NULL;

UPDATE invoices
SET cash_amount = CASE WHEN payment_method = 'transfer' THEN 0 ELSE total_amount END,
	transfer_amount = CASE WHEN payment_method = 'transfer' THEN total_amount ELSE 0 END;