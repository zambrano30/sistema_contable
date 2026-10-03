-- DIAGNOSTIC QUERY: Check invoice company_id status
SELECT 
  company_id,
  COUNT(*) as total,
  SUM(total_amount) as total_sales,
  COUNT(CASE WHEN total_amount = 0 THEN 1 END) as zero_total_count
FROM invoices
GROUP BY company_id
ORDER BY total DESC;

-- View all invoices with NULL company_id
SELECT 
  id,
  invoice_number,
  total_amount,
  created_at,
  client_id
FROM invoices
WHERE company_id IS NULL
ORDER BY created_at DESC;

-- If you need to assign a specific company_id to invoices without company:
-- First, get your company IDs:
SELECT id, name FROM companies;

-- Then assign to invoices (replace 'YOUR_COMPANY_ID' with actual ID):
-- UPDATE invoices 
-- SET company_id = 'YOUR_COMPANY_ID'
-- WHERE company_id IS NULL;

-- Verify after update:
SELECT company_id, COUNT(*) FROM invoices GROUP BY company_id;
