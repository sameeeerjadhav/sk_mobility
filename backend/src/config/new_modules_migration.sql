-- ============================================================
-- SK Mobility: New Modules Schema
-- Run this in phpMyAdmin → SQL tab
-- ============================================================

-- 1. HR MANAGEMENT
-- -----------------
CREATE TABLE IF NOT EXISTS employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_code VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  department VARCHAR(100),
  designation VARCHAR(100),
  salary DECIMAL(12,2) DEFAULT 0,
  join_date DATE,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  month TINYINT NOT NULL,
  year YEAR NOT NULL,
  basic_salary DECIMAL(12,2) NOT NULL,
  deductions DECIMAL(12,2) DEFAULT 0,
  net_salary DECIMAL(12,2) NOT NULL,
  payment_date DATE,
  notes TEXT,
  status ENUM('pending','paid') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY uq_emp_month_year (employee_id, month, year)
);

-- 2. PARTNER TRANSACTIONS
-- ------------------------
CREATE TABLE IF NOT EXISTS partners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type ENUM('investor','supplier','partner','other') DEFAULT 'partner',
  phone VARCHAR(20),
  email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS partner_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  partner_id INT NOT NULL,
  type ENUM('given','received') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

-- 3. OFFICE EXPENSES
-- -------------------
CREATE TABLE IF NOT EXISTS expense_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO expense_categories (name) VALUES
  ('Rent'),('Electricity'),('Internet'),('Office Supplies'),
  ('Travel'),('Food & Refreshments'),('Maintenance'),('Salaries'),
  ('Marketing'),('Miscellaneous');

CREATE TABLE IF NOT EXISTS office_expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  paid_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL
);

-- 4. BANK & LOANS
-- ----------------
CREATE TABLE IF NOT EXISTS bank_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50),
  account_type ENUM('current','savings','overdraft') DEFAULT 'current',
  balance DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lender_name VARCHAR(255) NOT NULL,
  loan_type ENUM('bank','personal','partner','other') DEFAULT 'bank',
  bank_account_id INT,
  principal_amount DECIMAL(15,2) NOT NULL,
  outstanding_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2),
  emi_amount DECIMAL(12,2),
  emi_date TINYINT COMMENT 'Day of month when EMI is due',
  start_date DATE,
  end_date DATE,
  status ENUM('active','closed') DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL
);
