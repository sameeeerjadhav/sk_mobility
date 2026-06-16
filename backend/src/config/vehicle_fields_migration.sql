-- ============================================================
-- SK Mobility: Vehicle Invoice Fields Migration
-- Run this in phpMyAdmin → SQL tab
-- ============================================================

-- Add vehicle-specific fields to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS chassis_no VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS motor_no VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS battery_capacity VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS color VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS customer_aadhaar VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS customer_pan VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS customer_address TEXT NULL,
  ADD COLUMN IF NOT EXISTS pm_drive_incentive DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS state_subsidy DECIMAL(10,2) DEFAULT 0;

-- Add all invoice-specific fields to bills table
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS chassis_no VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS motor_no VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS battery_capacity VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS color VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS customer_aadhaar VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS customer_pan VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS customer_address TEXT NULL,
  ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50) DEFAULT 'Individual',
  ADD COLUMN IF NOT EXISTS pm_drive_incentive DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS state_subsidy DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_in_words TEXT NULL,
  ADD COLUMN IF NOT EXISTS vehicle_model VARCHAR(200) NULL,
  -- Warranty certificate fields
  ADD COLUMN IF NOT EXISTS registration_no VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS sac_code VARCHAR(20) DEFAULT '999799',
  ADD COLUMN IF NOT EXISTS odometer_reading VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS vehicle_sale_date DATE NULL,
  ADD COLUMN IF NOT EXISTS chassis_registration VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS warranty_start DATE NULL,
  ADD COLUMN IF NOT EXISTS warranty_end DATE NULL,
  ADD COLUMN IF NOT EXISTS warranty_period VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS customer_city VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS customer_state VARCHAR(100) DEFAULT 'Maharashtra',
  ADD COLUMN IF NOT EXISTS state_code VARCHAR(10) DEFAULT 'MH';

SELECT 'Migration complete: vehicle invoice fields added' AS status;
