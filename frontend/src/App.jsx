import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchProfile } from './store/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DealersPage from './pages/DealersPage';
import VehiclesPage from './pages/VehiclesPage';
import OrdersPage from './pages/OrdersPage';
import PaymentsPage from './pages/PaymentsPage';
import InventoryPage from './pages/InventoryPage';
import LeadsPage from './pages/LeadsPage';
import ServicesPage from './pages/ServicesPage';
import SparePartsPage from './pages/SparePartsPage';
import BillingPage from './pages/BillingPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DealerRegisterPage from './pages/DealerRegisterPage';
import NotificationsPage from './pages/NotificationsPage';
import HRPage from './pages/HRPage';
import PartnersPage from './pages/PartnersPage';
import ExpensesPage from './pages/ExpensesPage';
import FinancePage from './pages/FinancePage';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      dispatch(fetchProfile());
    }
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dealer-register" element={<DealerRegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          <Route element={<ProtectedRoute roles={['super_admin']} />}>
              <Route path="/dealers" element={<DealersPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/spare-parts" element={<SparePartsPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/hr" element={<HRPage />} />
              <Route path="/partners" element={<PartnersPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/finance" element={<FinancePage />} />
            </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
