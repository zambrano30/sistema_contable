-- Fix invoices with total_amount = 0 by calculating from invoice_items
-- This script recalculates the total_amount based on the invoice items

-- First, let's see which invoices have total_amount = 0
SELECT id, invoice_number, total_amount, subtotal, discount_amount, tax_amount 
FROM invoices 
WHERE total_amount = 0 
ORDER BY created_at DESC;

-- Update invoices based on their items
UPDATE invoices
SET total_amount = COALESCE(
  (SELECT SUM(line_total) FROM invoice_items WHERE invoice_id = invoices.id),
  0
)
WHERE total_amount = 0
AND id IN (
  SELECT DISTINCT invoice_id FROM invoice_items
);

-- For invoices with 0 total and NO items, check if they have subtotal values
UPDATE invoices
SET total_amount = subtotal - COALESCE(discount_amount, 0)
WHERE total_amount = 0
AND subtotal > 0
AND id NOT IN (
  SELECT DISTINCT invoice_id FROM invoice_items
);

-- Verify the update
SELECT id, invoice_number, total_amount, subtotal, discount_amount 
FROM invoices 
WHERE created_at > now() - interval '7 days'
ORDER BY created_at DESC;
