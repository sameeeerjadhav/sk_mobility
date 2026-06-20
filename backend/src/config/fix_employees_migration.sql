-- ============================================================
-- SK Mobility: Fix Corrupt Employee Records
-- Run this in phpMyAdmin → SQL tab
-- ============================================================

-- Option 1: DELETE the blank/corrupt rows (those with no name)
DELETE FROM employees 
WHERE first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '';

-- Option 2 (if you want to KEEP them and fix): Update to placeholder
-- UPDATE employees SET first_name = 'Unknown', last_name = 'Employee', status = 'inactive'
-- WHERE first_name IS NULL OR first_name = '';

-- Verify what's left
SELECT id, employee_code, first_name, last_name, department, designation, salary, status 
FROM employees 
ORDER BY created_at DESC;
