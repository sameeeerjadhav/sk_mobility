const { asyncHandler, AppError } = require('../utils/helpers');
const vehicleService = require('../services/vehicle.service');
const orderService = require('../services/order.service');
const paymentService = require('../services/payment.service');
const inventoryService = require('../services/inventory.service');
const leadService = require('../services/lead.service');
const serviceMgmt = require('../services/serviceManagement.service');
const sparePartsService = require('../services/spareParts.service');
const billingService = require('../services/billing.service');
const dashboardService = require('../services/dashboard.service');
const adminService = require('../services/admin.service');
const notificationsService = require('../services/notifications.service');
const bizService = require('../services/business.service');

const wrap = (fn) => asyncHandler(async (req, res) => {
  const result = await fn(req);
  if (result?.buffer) {
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.buffer);
  }
  if (result?.pdfPath) {
    return res.download(result.pdfPath);
  }
  res.json({ success: true, ...(result?.data !== undefined ? { data: result.data } : result) });
});

module.exports = {
  // Vehicles
  listCategories: wrap(() => vehicleService.listCategories().then((data) => ({ data }))),
  listVehicles: wrap((req) => vehicleService.listVehicles(req.query).then((data) => data)),
  getVehicle: wrap((req) => vehicleService.getVehicle(req.params.id).then((data) => ({ data }))),
  createVehicle: wrap((req) => vehicleService.createVehicle(req.body).then((data) => ({ data }))),
  updateVehicle: wrap((req) => vehicleService.updateVehicle(req.params.id, req.body).then((data) => ({ data }))),
  deleteVehicle: wrap((req) => vehicleService.deleteVehicle(req.params.id).then((data) => ({ data }))),
  createVariant: wrap((req) => vehicleService.createVariant(req.params.id, req.body).then((data) => ({ data }))),
  addReview: wrap((req) => vehicleService.addReview(req.params.id, req.body, req.user.id).then(() => ({ data: { message: 'Review submitted' } }))),
  addVehicleImage: wrap((req) => {
    if (!req.file) throw new (require('../utils/helpers').AppError)('No file uploaded', 400);
    const replacePrimary = req.body.replacePrimary === 'true' || req.body.replacePrimary === true;
    return vehicleService.addImage(req.params.id, req.file, req.body.variantId, replacePrimary).then((data) => ({ data }));
  }),

  // Orders
  listOrders: wrap((req) => orderService.list(req.query, req.user).then((data) => data)),
  getOrder: wrap((req) => orderService.getById(req.params.id).then((data) => ({ data }))),
  listOrderVariants: wrap(() => orderService.listVariants().then((data) => ({ data }))),
  createOrder: wrap((req) => orderService.create(req.body, req.user.id, req).then((data) => ({ data }))),
  updateOrderStatus: wrap((req) => orderService.updateStatus(req.params.id, req.body, req.user.id, req).then((data) => ({ data }))),

  // Payments
  listPayments: wrap((req) => paymentService.list(req.query, req.user).then((data) => data)),
  listOrderPaymentSummaries: wrap((req) => paymentService.listOrderSummaries(req.query, req.user).then((data) => ({ data }))),
  paymentTotalsSummary: wrap((req) => paymentService.getTotalsSummary(req.user).then((data) => ({ data }))),
  createPayment: wrap((req) => paymentService.createPayment(req.body, req.user).then((data) => ({ data }))),
  verifyRazorpay: wrap((req) => paymentService.verifyRazorpay(req.body).then((data) => ({ data }))),
  createInvoice: wrap((req) => paymentService.createInvoice(req.body, req.user.id).then((data) => ({ data }))),
  createRefund: wrap((req) => paymentService.createRefund(req.params.id, req.body, req.user.id).then((data) => ({ data }))),

  // Inventory
  listWarehouses: wrap(() => inventoryService.listWarehouses().then((data) => ({ data }))),
  listInventory: wrap((req) => inventoryService.listInventory(req.query).then((data) => data)),
  adjustStock: wrap((req) => inventoryService.adjustStock(req.body, req.user.id).then((data) => ({ data }))),
  transferStock: wrap((req) => inventoryService.transferStock(req.body, req.user.id).then((data) => ({ data }))),

  // Leads
  listLeads: wrap((req) => leadService.list(req.query, req.user).then((data) => data)),
  createLead: wrap((req) => leadService.create(req.body).then((data) => ({ data }))),
  updateLeadStatus: wrap((req) => leadService.updateStatus(req.params.id, req.body, req.user.id).then((data) => ({ data }))),
  addFollowup: wrap((req) => leadService.addFollowup(req.params.id, req.body, req.user.id).then(() => ({ data: { message: 'Follow-up added' } }))),
  leadAnalytics: wrap((req) => leadService.getAnalytics(req.query.dealerId).then((data) => ({ data }))),
  listLeadSources: wrap(() => leadService.listSources().then((data) => ({ data }))),

  // Service
  listServiceRequests: wrap((req) => serviceMgmt.listRequests(req.query, req.user).then((data) => data)),
  createServiceRequest: wrap((req) => serviceMgmt.createRequest(req.body).then((data) => ({ data }))),
  createJobCard: wrap((req) => serviceMgmt.createJobCard(req.params.id, req.body, req.user.id).then((data) => ({ data }))),
  updateJobCard: wrap((req) => serviceMgmt.updateJobCard(req.params.id, req.body).then((data) => ({ data }))),
  listTechnicians: wrap(() => serviceMgmt.listTechnicians().then((data) => ({ data }))),
  serviceHistory: wrap((req) => serviceMgmt.getServiceHistory(req.params.vin).then((data) => ({ data }))),
  serviceDashboard: wrap(() => serviceMgmt.getDashboardStats().then((data) => ({ data }))),

  // Spare Parts
  listSpareParts: wrap((req) => sparePartsService.listParts(req.query).then((data) => data)),
  listSpareStock: wrap((req) => sparePartsService.listStock(req.query).then((data) => ({ data }))),
  recordSpareUsage: wrap((req) => sparePartsService.recordUsage(req.body, req.user.id).then(() => ({ data: { message: 'Usage recorded' } }))),
  listSpareCategories: wrap(() => sparePartsService.listCategories().then((data) => ({ data }))),

  // Billing
  listBills: wrap((req) => billingService.listBills(req.query).then((data) => ({ data }))),
  getBill: wrap((req) => billingService.getBillDetail(req.params.id).then((data) => ({ data }))),
  createBill: wrap((req) => billingService.createBill(req.body, req.user.id).then((data) => ({ data }))),
  generateBillPDF: wrap((req) => billingService.generatePDF(req.params.id)),
  listTaxes: wrap(() => billingService.listTaxes().then((data) => ({ data }))),

  // Dashboard
  adminDashboard: wrap(() => dashboardService.getSuperAdminDashboard().then((data) => ({ data }))),
  dealerDashboard: wrap((req) => {
    const dealerId = req.user.dealer?.id;
    if (!dealerId && req.user.role_slug === 'dealer') {
      throw new AppError('Dealer profile not linked to your account. Contact admin.', 403);
    }
    return dashboardService.getDealerDashboard(dealerId).then((data) => ({ data }));
  }),
  exportReport: wrap((req) => dashboardService.exportReport(req.params.type, req.query)),

  // Admin
  listUsers: wrap((req) => adminService.listUsers(req.query).then((data) => data)),
  createUser: wrap((req) => adminService.createUser(req.body, req).then((data) => ({ data }))),
  listRoles: wrap(() => adminService.listRoles().then((data) => ({ data }))),
  listPermissions: wrap(() => adminService.listPermissions().then((data) => ({ data }))),
  updateRolePermissions: wrap((req) => adminService.updateRolePermissions(req.params.id, req.body.permissionIds, req).then(() => ({ data: { message: 'Updated' } }))),
  listAuditLogs: wrap((req) => adminService.listAuditLogs(req.query).then((data) => data)),
  getSettings: wrap(() => adminService.getSettings().then((data) => ({ data }))),
  updateSetting: wrap((req) => adminService.updateSetting(req.params.key, req.body.value).then(() => ({ data: { message: 'Updated' } }))),

  // Notifications
  listNotifications: wrap((req) => notificationsService.list(req.user.id, req.query).then((data) => data)),
  markNotificationRead: wrap((req) => notificationsService.markRead(req.params.id, req.user.id).then(() => ({ data: { message: 'Marked read' } }))),
  markAllNotificationsRead: wrap((req) => notificationsService.markAllRead(req.user.id).then(() => ({ data: { message: 'All marked read' } }))),
  unreadCount: wrap((req) => notificationsService.getUnreadCount(req.user.id).then((count) => ({ data: { count } }))),

  // HR Management
  hrStats: wrap(() => bizService.getHRStats().then((data) => ({ data }))),
  listEmployees: wrap((req) => bizService.listEmployees(req.query).then((data) => data)),
  createEmployee: wrap((req) => bizService.createEmployee(req.body).then((data) => ({ data }))),
  updateEmployee: wrap((req) => bizService.updateEmployee(req.params.id, req.body).then((data) => ({ data }))),
  listSalaryRecords: wrap((req) => bizService.listSalaryRecords(req.params.employeeId).then((data) => ({ data }))),
  createSalaryRecord: wrap((req) => bizService.createSalaryRecord(req.body).then((data) => ({ data }))),

  // Partner Transactions
  partnerStats: wrap(() => bizService.getPartnerStats().then((data) => ({ data }))),
  listPartners: wrap(() => bizService.listPartners().then((data) => ({ data }))),
  createPartner: wrap((req) => bizService.createPartner(req.body).then((data) => ({ data }))),
  listPartnerTransactions: wrap((req) => bizService.listPartnerTransactions(req.params.partnerId).then((data) => ({ data }))),
  listAllTransactions: wrap((req) => bizService.listAllTransactions(req.query).then((data) => data)),
  createPartnerTransaction: wrap((req) => bizService.createPartnerTransaction(req.body).then((data) => ({ data }))),

  // Office Expenses
  expenseStats: wrap(() => bizService.getExpenseStats().then((data) => ({ data }))),
  listExpenseCategories: wrap(() => bizService.listExpenseCategories().then((data) => ({ data }))),
  listExpenses: wrap((req) => bizService.listExpenses(req.query).then((data) => data)),
  createExpense: wrap((req) => bizService.createExpense(req.body).then((data) => ({ data }))),
  deleteExpense: wrap((req) => bizService.deleteExpense(req.params.id).then(() => ({ data: { message: 'Deleted' } }))),

  // Bank & Loans
  financeStats: wrap(() => bizService.getFinanceStats().then((data) => ({ data }))),
  listBankAccounts: wrap(() => bizService.listBankAccounts().then((data) => ({ data }))),
  createBankAccount: wrap((req) => bizService.createBankAccount(req.body).then((data) => ({ data }))),
  updateBankAccount: wrap((req) => bizService.updateBankAccount(req.params.id, req.body).then((data) => ({ data }))),
  listLoans: wrap(() => bizService.listLoans().then((data) => ({ data }))),
  createLoan: wrap((req) => bizService.createLoan(req.body).then((data) => ({ data }))),
  updateLoan: wrap((req) => bizService.updateLoan(req.params.id, req.body).then((data) => ({ data }))),
};
