const db = require('../config/database');

// ─── HR MANAGEMENT ────────────────────────────────────────────────────────────

const listEmployees = async (query = {}) => {
  const { status, search, page = 1, limit = 50 } = query;
  const offset = (page - 1) * limit;
  const where = [];
  const params = [];

  if (status) { where.push('status = ?'); params.push(status); }
  if (search) { where.push('(first_name LIKE ? OR last_name LIKE ? OR employee_code LIKE ? OR designation LIKE ?)'); const s = `%${search}%`; params.push(s, s, s, s); }

  const whereStr = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [[{ total }], rows] = await Promise.all([
    db.query(`SELECT COUNT(*) as total FROM employees ${whereStr}`, params),
    db.query(`SELECT * FROM employees ${whereStr} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, Number(limit), offset]),
  ]);
  return { data: rows, total, page: Number(page), limit: Number(limit) };
};

const createEmployee = async (body) => {
  const { first_name, last_name, email, phone, department, designation, salary, join_date, status = 'active' } = body;
  const [[last]] = await db.query('SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1');
  const lastNum = last ? parseInt(last.employee_code.replace('EMP', '')) : 0;
  const employee_code = `EMP${String(lastNum + 1).padStart(4, '0')}`;
  const [result] = await db.query(
    'INSERT INTO employees (employee_code,first_name,last_name,email,phone,department,designation,salary,join_date,status) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [employee_code, first_name, last_name, email, phone, department, designation, salary || 0, join_date, status]
  );
  const [[emp]] = await db.query('SELECT * FROM employees WHERE id = ?', [result.insertId]);
  return emp;
};

const updateEmployee = async (id, body) => {
  const fields = ['first_name','last_name','email','phone','department','designation','salary','join_date','status'];
  const updates = fields.filter(f => body[f] !== undefined).map(f => `${f} = ?`);
  const vals = fields.filter(f => body[f] !== undefined).map(f => body[f]);
  if (!updates.length) throw new Error('No fields to update');
  await db.query(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`, [...vals, id]);
  const [[emp]] = await db.query('SELECT * FROM employees WHERE id = ?', [id]);
  return emp;
};

const listSalaryRecords = async (employeeId) => {
  const [rows] = await db.query(
    `SELECT sr.*, CONCAT(e.first_name,' ',e.last_name) AS employee_name, e.employee_code
     FROM salary_records sr JOIN employees e ON sr.employee_id = e.id
     WHERE sr.employee_id = ? ORDER BY sr.year DESC, sr.month DESC`, [employeeId]
  );
  return rows;
};

const createSalaryRecord = async (body) => {
  const { employee_id, month, year, basic_salary, deductions = 0, payment_date, notes, status = 'pending' } = body;
  const net_salary = parseFloat(basic_salary) - parseFloat(deductions);
  const [result] = await db.query(
    'INSERT INTO salary_records (employee_id,month,year,basic_salary,deductions,net_salary,payment_date,notes,status) VALUES (?,?,?,?,?,?,?,?,?)',
    [employee_id, month, year, basic_salary, deductions, net_salary, payment_date, notes, status]
  );
  const [[rec]] = await db.query('SELECT * FROM salary_records WHERE id = ?', [result.insertId]);
  return rec;
};

const getHRStats = async () => {
  const [[stats]] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM employees WHERE status='active') AS active_employees,
      (SELECT COUNT(*) FROM employees) AS total_employees,
      (SELECT COALESCE(SUM(salary),0) FROM employees WHERE status='active') AS monthly_payroll,
      (SELECT COUNT(*) FROM salary_records WHERE status='pending' AND month=MONTH(NOW()) AND year=YEAR(NOW())) AS pending_salaries
  `);
  return stats;
};

// ─── PARTNER TRANSACTIONS ──────────────────────────────────────────────────────

const listPartners = async () => {
  const [rows] = await db.query(`
    SELECT p.*,
      COALESCE(SUM(CASE WHEN pt.type='given' THEN pt.amount ELSE 0 END),0) AS total_given,
      COALESCE(SUM(CASE WHEN pt.type='received' THEN pt.amount ELSE 0 END),0) AS total_received
    FROM partners p
    LEFT JOIN partner_transactions pt ON pt.partner_id = p.id
    GROUP BY p.id ORDER BY p.name
  `);
  return rows;
};

const createPartner = async (body) => {
  const { name, type = 'partner', phone, email, notes } = body;
  const [result] = await db.query('INSERT INTO partners (name,type,phone,email,notes) VALUES (?,?,?,?,?)', [name, type, phone, email, notes]);
  const [[p]] = await db.query('SELECT * FROM partners WHERE id = ?', [result.insertId]);
  return p;
};

const listPartnerTransactions = async (partnerId) => {
  const [rows] = await db.query(
    'SELECT pt.*, p.name AS partner_name FROM partner_transactions pt JOIN partners p ON pt.partner_id = p.id WHERE pt.partner_id = ? ORDER BY pt.date DESC',
    [partnerId]
  );
  return rows;
};

const listAllTransactions = async (query = {}) => {
  const { page = 1, limit = 50 } = query;
  const offset = (page - 1) * limit;
  const [[{ total }], rows] = await Promise.all([
    db.query('SELECT COUNT(*) as total FROM partner_transactions'),
    db.query(`SELECT pt.*, p.name AS partner_name, p.type AS partner_type
      FROM partner_transactions pt JOIN partners p ON pt.partner_id = p.id
      ORDER BY pt.date DESC LIMIT ? OFFSET ?`, [Number(limit), offset]),
  ]);
  return { data: rows, total };
};

const createPartnerTransaction = async (body) => {
  const { partner_id, type, amount, date, description } = body;
  const [result] = await db.query(
    'INSERT INTO partner_transactions (partner_id,type,amount,date,description) VALUES (?,?,?,?,?)',
    [partner_id, type, amount, date, description]
  );
  const [[tx]] = await db.query('SELECT * FROM partner_transactions WHERE id = ?', [result.insertId]);
  return tx;
};

const getPartnerStats = async () => {
  const [[stats]] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM partners) AS total_partners,
      (SELECT COALESCE(SUM(amount),0) FROM partner_transactions WHERE type='given') AS total_given,
      (SELECT COALESCE(SUM(amount),0) FROM partner_transactions WHERE type='received') AS total_received
  `);
  stats.net_balance = parseFloat(stats.total_received) - parseFloat(stats.total_given);
  return stats;
};

// ─── OFFICE EXPENSES ───────────────────────────────────────────────────────────

const listExpenseCategories = async () => {
  const [rows] = await db.query('SELECT * FROM expense_categories ORDER BY name');
  return rows;
};

const listExpenses = async (query = {}) => {
  const { category_id, month, year, page = 1, limit = 50 } = query;
  const offset = (page - 1) * limit;
  const where = [];
  const params = [];

  if (category_id) { where.push('oe.category_id = ?'); params.push(category_id); }
  if (month) { where.push('MONTH(oe.date) = ?'); params.push(month); }
  if (year) { where.push('YEAR(oe.date) = ?'); params.push(year); }

  const whereStr = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [[{ total }], rows] = await Promise.all([
    db.query(`SELECT COUNT(*) as total FROM office_expenses oe ${whereStr}`, params),
    db.query(
      `SELECT oe.*, ec.name AS category_name FROM office_expenses oe
       LEFT JOIN expense_categories ec ON oe.category_id = ec.id
       ${whereStr} ORDER BY oe.date DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    ),
  ]);
  return { data: rows, total };
};

const createExpense = async (body) => {
  const { category_id, amount, date, description, paid_by } = body;
  const [result] = await db.query(
    'INSERT INTO office_expenses (category_id,amount,date,description,paid_by) VALUES (?,?,?,?,?)',
    [category_id, amount, date, description, paid_by]
  );
  const [[exp]] = await db.query(
    'SELECT oe.*, ec.name AS category_name FROM office_expenses oe LEFT JOIN expense_categories ec ON oe.category_id = ec.id WHERE oe.id = ?',
    [result.insertId]
  );
  return exp;
};

const deleteExpense = async (id) => {
  await db.query('DELETE FROM office_expenses WHERE id = ?', [id]);
};

const getExpenseStats = async () => {
  const [[stats]] = await db.query(`
    SELECT
      (SELECT COALESCE(SUM(amount),0) FROM office_expenses WHERE MONTH(date)=MONTH(NOW()) AND YEAR(date)=YEAR(NOW())) AS this_month,
      (SELECT COALESCE(SUM(amount),0) FROM office_expenses WHERE YEAR(date)=YEAR(NOW())) AS this_year,
      (SELECT COALESCE(SUM(amount),0) FROM office_expenses) AS total_all_time,
      (SELECT COUNT(*) FROM office_expenses WHERE MONTH(date)=MONTH(NOW()) AND YEAR(date)=YEAR(NOW())) AS entries_this_month
  `);
  return stats;
};

// ─── BANK & LOANS ──────────────────────────────────────────────────────────────

const listBankAccounts = async () => {
  const [rows] = await db.query('SELECT * FROM bank_accounts ORDER BY bank_name');
  return rows;
};

const createBankAccount = async (body) => {
  const { bank_name, account_number, account_type = 'current', balance = 0, notes } = body;
  const [result] = await db.query(
    'INSERT INTO bank_accounts (bank_name,account_number,account_type,balance,notes) VALUES (?,?,?,?,?)',
    [bank_name, account_number, account_type, balance, notes]
  );
  const [[acc]] = await db.query('SELECT * FROM bank_accounts WHERE id = ?', [result.insertId]);
  return acc;
};

const updateBankAccount = async (id, body) => {
  const fields = ['bank_name','account_number','account_type','balance','notes'];
  const updates = fields.filter(f => body[f] !== undefined).map(f => `${f} = ?`);
  const vals = fields.filter(f => body[f] !== undefined).map(f => body[f]);
  await db.query(`UPDATE bank_accounts SET ${updates.join(', ')} WHERE id = ?`, [...vals, id]);
  const [[acc]] = await db.query('SELECT * FROM bank_accounts WHERE id = ?', [id]);
  return acc;
};

const listLoans = async () => {
  const [rows] = await db.query(`
    SELECT l.*, ba.bank_name AS bank_account_name
    FROM loans l LEFT JOIN bank_accounts ba ON l.bank_account_id = ba.id
    ORDER BY l.status ASC, l.created_at DESC
  `);
  return rows;
};

const createLoan = async (body) => {
  const { lender_name, loan_type='bank', bank_account_id, principal_amount, outstanding_amount, interest_rate, emi_amount, emi_date, start_date, end_date, notes } = body;
  const [result] = await db.query(
    'INSERT INTO loans (lender_name,loan_type,bank_account_id,principal_amount,outstanding_amount,interest_rate,emi_amount,emi_date,start_date,end_date,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [lender_name, loan_type, bank_account_id || null, principal_amount, outstanding_amount, interest_rate, emi_amount, emi_date, start_date, end_date, notes]
  );
  const [[loan]] = await db.query('SELECT * FROM loans WHERE id = ?', [result.insertId]);
  return loan;
};

const updateLoan = async (id, body) => {
  const fields = ['lender_name','loan_type','outstanding_amount','interest_rate','emi_amount','emi_date','status','notes'];
  const updates = fields.filter(f => body[f] !== undefined).map(f => `${f} = ?`);
  const vals = fields.filter(f => body[f] !== undefined).map(f => body[f]);
  await db.query(`UPDATE loans SET ${updates.join(', ')} WHERE id = ?`, [...vals, id]);
  const [[loan]] = await db.query('SELECT * FROM loans WHERE id = ?', [id]);
  return loan;
};

const getFinanceStats = async () => {
  const [[stats]] = await db.query(`
    SELECT
      (SELECT COALESCE(SUM(balance),0) FROM bank_accounts) AS total_bank_balance,
      (SELECT COALESCE(SUM(outstanding_amount),0) FROM loans WHERE status='active') AS total_outstanding_loans,
      (SELECT COUNT(*) FROM loans WHERE status='active') AS active_loans,
      (SELECT COALESCE(SUM(emi_amount),0) FROM loans WHERE status='active') AS monthly_emi_total
  `);
  return stats;
};

module.exports = {
  // HR
  listEmployees, createEmployee, updateEmployee,
  listSalaryRecords, createSalaryRecord, getHRStats,
  // Partners
  listPartners, createPartner, listPartnerTransactions,
  listAllTransactions, createPartnerTransaction, getPartnerStats,
  // Expenses
  listExpenseCategories, listExpenses, createExpense, deleteExpense, getExpenseStats,
  // Finance
  listBankAccounts, createBankAccount, updateBankAccount,
  listLoans, createLoan, updateLoan, getFinanceStats,
};
