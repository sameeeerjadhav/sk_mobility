import api from './api';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const dashboardAPI = {
  admin: () => api.get('/dashboard/admin'),
  dealer: () => api.get('/dashboard/dealer'),
  service: () => api.get('/dashboard/service'),
  exportReport: (type, format) => api.get(`/reports/export/${type}`, { params: { format }, responseType: 'blob' }),
};

export const dealersAPI = {
  list: (params) => api.get('/dealers', { params }),
  get: (id) => api.get(`/dealers/${id}`),
  create: (data) => api.post('/dealers', data),
  register: (data) => api.post('/dealers/register', data),
  approve: (id, data) => api.patch(`/dealers/${id}/approve`, data),
  me: () => api.get('/dealers/me'),
  performance: (id) => api.get(`/dealers/${id}/performance`),
};

export const vehiclesAPI = {
  list: (params) => api.get('/vehicles', { params }),
  get: (id) => api.get(`/vehicles/${id}`),
  categories: () => api.get('/vehicles/categories'),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  uploadImage: (id, file, replacePrimary = false) => {
    const formData = new FormData();
    formData.append('image', file);
    if (replacePrimary) formData.append('replacePrimary', 'true');
    return api.post(`/vehicles/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const ordersAPI = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  variants: () => api.get('/orders/variants'),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
};

export const paymentsAPI = {
  list: (params) => api.get('/payments', { params }),
  orderSummaries: (params) => api.get('/payments/orders', { params }),
  summary: () => api.get('/payments/summary'),
  create: (data) => api.post('/payments', data),
  verifyRazorpay: (data) => api.post('/payments/verify-razorpay', data),
};

export const inventoryAPI = {
  list: (params) => api.get('/inventory', { params }),
  warehouses: () => api.get('/warehouses'),
  adjust: (data) => api.post('/inventory/adjust', data),
  transfer: (data) => api.post('/inventory/transfer', data),
};

export const leadsAPI = {
  list: (params) => api.get('/leads', { params }),
  create: (data) => api.post('/leads', data),
  capture: (data) => api.post('/leads/capture', data),
  updateStatus: (id, data) => api.patch(`/leads/${id}/status`, data),
  analytics: (params) => api.get('/leads/analytics', { params }),
  sources: () => api.get('/leads/sources'),
};

export const servicesAPI = {
  list: (params) => api.get('/services', { params }),
  create: (data) => api.post('/services', data),
  technicians: () => api.get('/services/technicians'),
  createJobCard: (id, data) => api.post(`/services/${id}/job-cards`, data),
};

export const sparePartsAPI = {
  list: (params) => api.get('/spare-parts', { params }),
  stock: (params) => api.get('/spare-parts/stock', { params }),
  categories: () => api.get('/spare-parts/categories'),
};

export const billingAPI = {
  list: () => api.get('/bills'),
  get: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  pdf: (id) => api.get(`/bills/${id}/pdf`, { responseType: 'blob' }),
  taxes: () => api.get('/taxes'),
};

export const adminAPI = {
  users: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  roles: () => api.get('/admin/roles'),
  permissions: () => api.get('/admin/permissions'),
  auditLogs: (params) => api.get('/admin/audit-logs', { params }),
  settings: () => api.get('/admin/settings'),
};

export const notificationsAPI = {
  list: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ─── NEW MODULES ───────────────────────────────────────────────

export const hrAPI = {
  stats: () => api.get('/hr/stats'),
  employees: (params) => api.get('/hr/employees', { params }),
  createEmployee: (data) => api.post('/hr/employees', data),
  updateEmployee: (id, data) => api.put(`/hr/employees/${id}`, data),
  salaries: (employeeId) => api.get(`/hr/employees/${employeeId}/salaries`),
  createSalary: (data) => api.post('/hr/salaries', data),
};

export const partnersAPI = {
  stats: () => api.get('/partners/stats'),
  list: () => api.get('/partners'),
  create: (data) => api.post('/partners', data),
  transactions: (partnerId) => api.get(`/partners/${partnerId}/transactions`),
  allTransactions: (params) => api.get('/partner-transactions', { params }),
  createTransaction: (data) => api.post('/partner-transactions', data),
};

export const expensesAPI = {
  stats: () => api.get('/expenses/stats'),
  categories: () => api.get('/expenses/categories'),
  list: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export const financeAPI = {
  stats: () => api.get('/finance/stats'),
  bankAccounts: () => api.get('/finance/bank-accounts'),
  createBankAccount: (data) => api.post('/finance/bank-accounts', data),
  updateBankAccount: (id, data) => api.put(`/finance/bank-accounts/${id}`, data),
  loans: () => api.get('/finance/loans'),
  createLoan: (data) => api.post('/finance/loans', data),
  updateLoan: (id, data) => api.put(`/finance/loans/${id}`, data),
};
