import { Box, Grid, Typography, Paper, Chip, Alert, Skeleton, Divider } from '@mui/material';
import {
  Store, DirectionsCar, AttachMoney, People, Build, Inventory2,
  AccountBalance, TrendingDown, CalendarMonth, Badge,
  WbSunny, WbCloudy, Nightlight,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { dashboardAPI } from '../services';
import { useAuth, isSuperAdmin } from '../hooks/useAuth';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const statusColors = {
  pending: 'warning', approved: 'info', processing: 'primary',
  shipped: 'secondary', delivered: 'success', cancelled: 'error',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', Icon: WbSunny, color: '#f59e0b' };
  if (h < 17) return { text: 'Good afternoon', Icon: WbCloudy, color: '#0ea5e9' };
  return { text: 'Good evening', Icon: Nightlight, color: '#6366f1' };
}

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      titleFont: { family: 'Inter', size: 12, weight: '600' },
      bodyFont: { family: 'Inter', size: 13 },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label: (ctx) => ` ₹${Number(ctx.parsed.y).toLocaleString('en-IN')}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { font: { family: 'Inter', size: 11 }, color: '#94a3b8' },
    },
    y: {
      grid: { color: 'rgba(226,232,240,0.6)', drawBorder: false },
      border: { display: false, dash: [4, 4] },
      ticks: {
        font: { family: 'Inter', size: 11 },
        color: '#94a3b8',
        callback: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
      },
    },
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = isSuperAdmin(user);
  const { text: greeting, Icon: GreetIcon, color: gColor } = getGreeting();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', isAdmin ? 'admin' : 'dealer'],
    queryFn: () => (isAdmin ? dashboardAPI.admin() : dashboardAPI.dealer()).then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  if (isError && !isAdmin) {
    const msg = error?.response?.data?.message || 'Unable to load dealer dashboard';
    return (
      <Box>
        <Box mb={3}>
          <Typography variant="h5" fontWeight={700} color="#0f172a">My Dashboard</Typography>
        </Box>
        <Alert severity="error">{msg}. Ask admin to link your dealer profile or approve your registration.</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <Skeleton width={240} height={40} sx={{ mb: 0.5 }} />
        <Skeleton width={320} height={20} sx={{ mb: 3 }} />
        <Grid container spacing={2.5} mb={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
              <Box sx={{ bgcolor: '#fff', borderRadius: '18px', p: 2.5, border: '1px solid #f1f5f9' }}>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Skeleton width={70} height={14} />
                  <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: '12px' }} />
                </Box>
                <Skeleton width={90} height={42} sx={{ mb: 0.75 }} />
                <Skeleton width={110} height={14} />
              </Box>
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={8}>
            <Box sx={{ bgcolor: '#fff', borderRadius: '18px', p: 3, border: '1px solid #f1f5f9' }}>
              <Skeleton width={160} height={24} sx={{ mb: 2.5 }} />
              <Skeleton variant="rectangular" height={240} sx={{ borderRadius: '10px' }} />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ bgcolor: '#fff', borderRadius: '18px', p: 3, border: '1px solid #f1f5f9' }}>
              <Skeleton width={120} height={24} sx={{ mb: 2 }} />
              {[1,2,3,4,5].map(i => <Skeleton key={i} height={52} sx={{ mb: 0.5, borderRadius: '10px' }} />)}
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  const stats = data?.stats || {};

  const chartLabels = data?.monthlySales?.map((m) => {
    const [y, mo] = m.month.split('-');
    return new Date(y, mo - 1).toLocaleString('en-IN', { month: 'short' });
  }) || [];

  const revenueData = data?.monthlySales?.map((m) => Number(m.revenue)) || [];

  const lineChartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Revenue',
      data: revenueData,
      borderColor: '#0d9488',
      backgroundColor: (ctx) => {
        const chart = ctx.chart;
        const { ctx: c, chartArea } = chart;
        if (!chartArea) return 'transparent';
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, 'rgba(99,102,241,0.18)');
        g.addColorStop(1, 'rgba(99,102,241,0)');
        return g;
      },
      fill: true,
      tension: 0.45,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      borderWidth: 2.5,
    }],
  };

  const barChartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Orders',
      data: data?.monthlySales?.map((m) => Number(m.orders)) || [],
      backgroundColor: 'rgba(16,185,129,0.8)',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const orderColumns = [
    { field: 'order_number', headerName: 'Order #', flex: 1, minWidth: 130 },
    { field: 'business_name', headerName: 'Dealer', flex: 1.5, minWidth: 150 },
    {
      field: 'total_amount', headerName: 'Amount', flex: 1, minWidth: 120,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 700, color: '#10b981', fontSize: '13px' }}>
          ₹{Number(params.value).toLocaleString('en-IN')}
        </Typography>
      ),
    },
    {
      field: 'status', headerName: 'Status', flex: 1, minWidth: 120,
      renderCell: (params) => (
        <Chip label={params.value} color={statusColors[params.value] || 'default'} size="small"
          sx={{ textTransform: 'capitalize', fontWeight: 600 }}
        />
      ),
    },
  ];

  return (
    <Box>
      {/* ── Hero Header ── */}
      <Box sx={{
        mb: 4,
        p: 3,
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #0f2a27 0%, #134e4a 50%, #0f766e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <Box sx={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,148,136,0.3) 0%, transparent 70%)',
          top: -100, right: -50, pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.2) 0%, transparent 70%)',
          bottom: -80, left: 200, pointerEvents: 'none',
        }} />

        <Box display="flex" alignItems="center" gap={1.5} mb={1} sx={{ position: 'relative', zIndex: 1 }}>
          <GreetIcon sx={{ fontSize: 22, color: gColor }} />
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>
            {greeting}
          </Typography>
        </Box>
        <Typography sx={{
          fontSize: { xs: '1.5rem', sm: '2rem' },
          fontWeight: 800, color: '#fff',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
          position: 'relative', zIndex: 1,
          mb: 0.5,
        }}>
          {isAdmin ? 'Operations Overview' : 'My Dashboard'}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', position: 'relative', zIndex: 1 }}>
          {user?.first_name ? `Welcome back, ${user.first_name}. ` : ''}
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Typography>
      </Box>

      {/* ── Row 1: Core KPIs ── */}
      <Grid container spacing={2.5} mb={2.5}>
        {isAdmin ? (
          <>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard title="Total Dealers" value={stats.total_dealers || 0} icon={<Store sx={{ fontSize: 20 }} />} color="#6366f1" trend={8} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard title="Vehicles Sold" value={stats.total_vehicles_sold || 0} icon={<DirectionsCar sx={{ fontSize: 20 }} />} color="#10b981" trend={12} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard title="Total Revenue" value={`₹${Number(stats.total_revenue || 0).toLocaleString('en-IN')}`} icon={<AttachMoney sx={{ fontSize: 20 }} />} color="#f59e0b" trend={5} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard title="Total Leads" value={stats.total_leads || 0} icon={<People sx={{ fontSize: 20 }} />} color="#3b82f6" trend={19} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard title="Service Requests" value={stats.service_requests || 0} icon={<Build sx={{ fontSize: 20 }} />} color="#8b5cf6" />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <StatCard title="Low Stock Items" value={stats.low_stock_items || 0} icon={<Inventory2 sx={{ fontSize: 20 }} />} color="#ef4444" />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="My Orders" value={stats.total_orders || 0} icon={<DirectionsCar sx={{ fontSize: 20 }} />} color="#6366f1" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Revenue" value={`₹${Number(stats.revenue || 0).toLocaleString('en-IN')}`} icon={<AttachMoney sx={{ fontSize: 20 }} />} color="#10b981" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Leads" value={stats.total_leads || 0} icon={<People sx={{ fontSize: 20 }} />} color="#3b82f6" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Service Requests" value={stats.service_requests || 0} icon={<Build sx={{ fontSize: 20 }} />} color="#8b5cf6" />
            </Grid>
          </>
        )}
      </Grid>

      {/* ── Row 2: HR / Finance (admin only) ── */}
      {isAdmin && (
        <>
          <Box display="flex" alignItems="center" gap={2} mb={2.5}>
            <Divider sx={{ flex: 1, borderColor: 'rgba(226,232,240,0.8)' }} />
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              bgcolor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '100px', px: 2, py: 0.5,
            }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#0d9488' }} />
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#0d9488', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                HR · Finance · Operations
              </Typography>
            </Box>
            <Divider sx={{ flex: 1, borderColor: 'rgba(226,232,240,0.8)' }} />
          </Box>

          <Grid container spacing={2.5} mb={3.5}>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <StatCard
                title="Monthly Payroll"
                value={`₹${Number(stats.total_monthly_payroll || 0).toLocaleString('en-IN')}`}
                subtitle={`${stats.active_employees || 0} active employees`}
                icon={<Badge sx={{ fontSize: 20 }} />}
                color="#0ea5e9"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <StatCard
                title="Bank Balance"
                value={`₹${Number(stats.total_bank_balance || 0).toLocaleString('en-IN')}`}
                subtitle="All accounts combined"
                icon={<AccountBalance sx={{ fontSize: 20 }} />}
                color="#10b981"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <StatCard
                title="Expenses This Month"
                value={`₹${Number(stats.expenses_this_month || 0).toLocaleString('en-IN')}`}
                subtitle={new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                icon={<CalendarMonth sx={{ fontSize: 20 }} />}
                color="#f59e0b"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <StatCard
                title="Outstanding Loans"
                value={`₹${Number(stats.total_outstanding_loans || 0).toLocaleString('en-IN')}`}
                subtitle="Total remaining across all loans"
                icon={<TrendingDown sx={{ fontSize: 20 }} />}
                color="#ef4444"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <StatCard
                title="Net Position"
                value={`₹${Math.max(0, Number(stats.total_bank_balance || 0) - Number(stats.total_outstanding_loans || 0)).toLocaleString('en-IN')}`}
                subtitle="Bank balance minus loans"
                icon={<AttachMoney sx={{ fontSize: 20 }} />}
                color={Number(stats.total_bank_balance || 0) >= Number(stats.total_outstanding_loans || 0) ? '#10b981' : '#ef4444'}
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* ── Charts Row ── */}
      {isAdmin && data?.monthlySales?.length > 0 && (
        <Grid container spacing={2.5} mb={3}>
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, borderRadius: '18px', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', letterSpacing: '-0.01em' }}>
                    Revenue Trend
                  </Typography>
                  <Typography variant="caption" color="#64748b">Monthly revenue for the past 12 months</Typography>
                </Box>
                <Box sx={{
                  bgcolor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '8px', px: 1.5, py: 0.5,
                }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0d9488' }}>12 Months</Typography>
                </Box>
              </Box>
              <Box sx={{ height: 260 }}>
                <Line data={lineChartData} options={{ ...CHART_OPTIONS, maintainAspectRatio: false }} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, borderRadius: '18px', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', height: '100%' }}>
              <Box mb={3}>
                <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Monthly Orders
                </Typography>
                <Typography variant="caption" color="#64748b">Order volume by month</Typography>
              </Box>
              <Box sx={{ height: 260 }}>
                <Bar
                  data={barChartData}
                  options={{
                    ...CHART_OPTIONS,
                    maintainAspectRatio: false,
                    scales: {
                      ...CHART_OPTIONS.scales,
                      y: {
                        ...CHART_OPTIONS.scales.y,
                        ticks: { ...CHART_OPTIONS.scales.y.ticks, callback: (v) => v },
                      },
                    },
                    plugins: {
                      ...CHART_OPTIONS.plugins,
                      tooltip: {
                        ...CHART_OPTIONS.plugins.tooltip,
                        callbacks: { label: (ctx) => ` ${ctx.parsed.y} orders` },
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ── Recent Orders ── */}
      {isAdmin && data?.recentOrders && (
        <DataTable
          title="Recent Orders"
          rows={data.recentOrders.map((o, i) => ({ id: i, ...o }))}
          columns={orderColumns}
        />
      )}
    </Box>
  );
}
