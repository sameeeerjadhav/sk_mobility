const router = require('express').Router();
const c = require('../controllers/modules.controller');
const { authenticate } = require('../middleware/auth');
const { authorize, authorizeRoles } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const { optionalAuth } = require('../middleware/auth');

// Public lead capture
router.post('/leads/capture', c.createLead);
router.get('/vehicles/catalog', c.listVehicles);
router.get('/vehicles/categories', c.listCategories);
router.get('/vehicles/:id', c.getVehicle);

router.use(authenticate);

// Dashboard
router.get('/dashboard/admin', authorize('view_dashboard'), authorizeRoles('super_admin'), c.adminDashboard);
router.get('/dashboard/dealer', authorize('view_dashboard'), c.dealerDashboard);
router.get('/dashboard/service', authorize('view_services'), c.serviceDashboard);
router.get('/reports/export/:type', authorize('export_reports'), c.exportReport);

// Vehicles
router.get('/vehicles', authorize('view_vehicles'), c.listVehicles);
router.post('/vehicles', authorize('manage_vehicles'), c.createVehicle);
router.put('/vehicles/:id', authorize('manage_vehicles'), c.updateVehicle);
router.delete('/vehicles/:id', authorize('manage_vehicles'), c.deleteVehicle);
router.post('/vehicles/:id/variants', authorize('manage_vehicles'), c.createVariant);
router.post('/vehicles/:id/reviews', authorize('view_vehicles'), c.addReview);
router.post('/vehicles/:id/images', authorize('manage_vehicles'), (req, res, next) => {
  req.uploadSubDir = 'vehicles';
  next();
}, upload.single('image'), c.addVehicleImage);

// Orders
router.get('/orders/variants', authorize('view_orders', 'manage_orders'), c.listOrderVariants);
router.get('/orders', authorize('view_orders'), c.listOrders);
router.get('/orders/:id', authorize('view_orders'), c.getOrder);
router.post('/orders', authorize('manage_orders'), c.createOrder);
router.patch('/orders/:id/status', authorize('approve_orders', 'manage_orders'), c.updateOrderStatus);

// Payments
router.get('/payments/orders', authorize('view_payments'), c.listOrderPaymentSummaries);
router.get('/payments/summary', authorize('view_payments'), c.paymentTotalsSummary);
router.get('/payments', authorize('view_payments'), c.listPayments);
router.post('/payments', authorize('manage_payments', 'view_payments'), c.createPayment);
router.post('/payments/verify-razorpay', authorize('manage_payments', 'view_payments'), c.verifyRazorpay);
router.post('/invoices', authorize('manage_payments'), c.createInvoice);
router.post('/payments/:id/refund', authorize('manage_payments'), c.createRefund);

// Inventory
router.get('/warehouses', authorize('view_inventory'), c.listWarehouses);
router.get('/inventory', authorize('view_inventory'), c.listInventory);
router.post('/inventory/adjust', authorize('manage_inventory'), c.adjustStock);
router.post('/inventory/transfer', authorize('manage_inventory'), c.transferStock);

// Leads
router.get('/leads/sources', authorize('view_leads'), c.listLeadSources);
router.get('/leads/analytics', authorize('view_leads', 'view_reports'), c.leadAnalytics);
router.get('/leads', authorize('view_leads'), c.listLeads);
router.post('/leads', authorize('manage_leads'), c.createLead);
router.patch('/leads/:id/status', authorize('manage_leads'), c.updateLeadStatus);
router.post('/leads/:id/followups', authorize('manage_leads'), c.addFollowup);

// Service Management
router.get('/services/technicians', authorize('view_services'), c.listTechnicians);
router.get('/services/history/:vin', authorize('view_services'), c.serviceHistory);
router.get('/services', authorize('view_services'), c.listServiceRequests);
router.post('/services', authorize('manage_services'), c.createServiceRequest);
router.post('/services/:id/job-cards', authorize('manage_services'), c.createJobCard);
router.patch('/job-cards/:id', authorize('manage_services'), c.updateJobCard);

// Spare Parts
router.get('/spare-parts/categories', authorize('view_spare_parts'), c.listSpareCategories);
router.get('/spare-parts/stock', authorize('view_spare_parts'), c.listSpareStock);
router.get('/spare-parts', authorize('view_spare_parts'), c.listSpareParts);
router.post('/spare-parts/usage', authorize('manage_spare_parts'), c.recordSpareUsage);

// Billing
router.get('/taxes', authorize('view_billing'), c.listTaxes);
router.get('/bills', authorize('view_billing'), c.listBills);
router.get('/bills/:id/pdf', authorize('view_billing', 'view_orders'), c.generateBillPDF);
router.get('/bills/:id', authorize('view_billing', 'view_orders'), c.getBill);
router.post('/bills', authorize('manage_billing'), c.createBill);
router.post('/bills/warranty', authorizeRoles('super_admin'), c.createWarrantyBill);

// Admin
router.get('/admin/users', authorize('manage_users'), c.listUsers);
router.post('/admin/users', authorize('manage_users'), c.createUser);
router.get('/admin/roles', authorize('manage_roles'), c.listRoles);
router.get('/admin/permissions', authorize('manage_roles'), c.listPermissions);
router.put('/admin/roles/:id/permissions', authorize('manage_roles'), c.updateRolePermissions);
router.get('/admin/audit-logs', authorize('view_audit_logs'), c.listAuditLogs);
router.get('/admin/settings', authorize('manage_settings'), c.getSettings);
router.put('/admin/settings/:key', authorize('manage_settings'), c.updateSetting);

// Notifications
router.get('/notifications', c.listNotifications);
router.get('/notifications/unread-count', c.unreadCount);
router.patch('/notifications/:id/read', c.markNotificationRead);
router.patch('/notifications/read-all', c.markAllNotificationsRead);

// ─── HR MANAGEMENT ───────────────────────────────────────────
router.get('/hr/stats', authorizeRoles('super_admin'), c.hrStats);
router.get('/hr/employees', authorizeRoles('super_admin'), c.listEmployees);
router.post('/hr/employees', authorizeRoles('super_admin'), c.createEmployee);
router.put('/hr/employees/:id', authorizeRoles('super_admin'), c.updateEmployee);
router.delete('/hr/employees/:id', authorizeRoles('super_admin'), c.deleteEmployee);
router.get('/hr/employees/:employeeId/salaries', authorizeRoles('super_admin'), c.listSalaryRecords);
router.post('/hr/salaries', authorizeRoles('super_admin'), c.createSalaryRecord);
router.delete('/hr/salaries/:id', authorizeRoles('super_admin'), c.deleteSalaryRecord);

// ─── PARTNER TRANSACTIONS ────────────────────────────────────
router.get('/partners/stats', authorizeRoles('super_admin'), c.partnerStats);
router.get('/partners', authorizeRoles('super_admin'), c.listPartners);
router.post('/partners', authorizeRoles('super_admin'), c.createPartner);
router.put('/partners/:id', authorizeRoles('super_admin'), c.updatePartner);
router.delete('/partners/:id', authorizeRoles('super_admin'), c.deletePartner);
router.get('/partners/:partnerId/transactions', authorizeRoles('super_admin'), c.listPartnerTransactions);
router.get('/partner-transactions', authorizeRoles('super_admin'), c.listAllTransactions);
router.post('/partner-transactions', authorizeRoles('super_admin'), c.createPartnerTransaction);
router.put('/partner-transactions/:id', authorizeRoles('super_admin'), c.updatePartnerTransaction);
router.delete('/partner-transactions/:id', authorizeRoles('super_admin'), c.deletePartnerTransaction);

// ─── OFFICE EXPENSES ─────────────────────────────────────────
router.get('/expenses/stats', authorizeRoles('super_admin'), c.expenseStats);
router.get('/expenses/categories', authorizeRoles('super_admin'), c.listExpenseCategories);
router.post('/expenses/categories', authorizeRoles('super_admin'), c.createExpenseCategory);
router.put('/expenses/categories/:id', authorizeRoles('super_admin'), c.updateExpenseCategory);
router.delete('/expenses/categories/:id', authorizeRoles('super_admin'), c.deleteExpenseCategory);
router.get('/expenses', authorizeRoles('super_admin'), c.listExpenses);
router.post('/expenses', authorizeRoles('super_admin'), c.createExpense);
router.put('/expenses/:id', authorizeRoles('super_admin'), c.updateExpense);
router.delete('/expenses/:id', authorizeRoles('super_admin'), c.deleteExpense);

// ─── BANK & LOANS ────────────────────────────────────────────
router.get('/finance/stats', authorizeRoles('super_admin'), c.financeStats);
router.get('/finance/bank-accounts', authorizeRoles('super_admin'), c.listBankAccounts);
router.post('/finance/bank-accounts', authorizeRoles('super_admin'), c.createBankAccount);
router.put('/finance/bank-accounts/:id', authorizeRoles('super_admin'), c.updateBankAccount);
router.delete('/finance/bank-accounts/:id', authorizeRoles('super_admin'), c.deleteBankAccount);
router.get('/finance/loans', authorizeRoles('super_admin'), c.listLoans);
router.post('/finance/loans', authorizeRoles('super_admin'), c.createLoan);
router.put('/finance/loans/:id', authorizeRoles('super_admin'), c.updateLoan);
router.delete('/finance/loans/:id', authorizeRoles('super_admin'), c.deleteLoan);

module.exports = router;
