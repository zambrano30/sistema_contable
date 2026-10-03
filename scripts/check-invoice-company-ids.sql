-- Check invoices and their company_ids
SELECT 
  id,
  invoice_number,
  company_id,
  total_amount,
  created_at
FROM invoices
ORDER BY created_at DESC
LIMIT 20;

-- Check if invoices have NULL company_id
SELECT 
  COUNT(*) as total_invoices,
  COUNT(CASE WHEN company_id IS NULL THEN 1 END) as invoices_without_company,
  COUNT(CASE WHEN total_amount = 0 THEN 1 END) as invoices_with_zero_total
FROM invoices;

-- Check company_ids available
SELECT DISTINCT company_id, COUNT(*) as invoice_count
FROM invoices
GROUP BY company_id;

-- If you need to update company_id for invoices without a company
-- First, identify which company should own them
-- Then run this update:
-- UPDATE invoices 
-- SET company_id = 'YOUR_COMPANY_ID_HERE'
-- WHERE company_id IS NULL;
