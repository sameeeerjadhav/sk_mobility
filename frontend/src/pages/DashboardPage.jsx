import { Box, Grid, Typography, Paper, Chip, CircularProgress, Alert } from '@mui/material';
import { Store, DirectionsCar, AttachMoney, People, Build, Inventory2 } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { dashboardAPI } from '../services';
import { useAuth, isSuperAdmin } from '../hooks/useAuth';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const statusColors = {
  pending: 'warning', approved: 'info', processing: 'primary',
  shipped: 'secondary', delivered: 'success', cancelled: 'error',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = isSuperAdmin(user);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', isAdmin ? 'admin' : 'dealer'],
    queryFn: () => (isAdmin ? dashboardAPI.admin() : dashboardAPI.dealer()).then((r) => r.data.data),
  });

  if (isLoading) {
    return <Box display="flex" justifyContent="center" p={8}><CircularProgress /></Box>;
  }

  if (isError && !isAdmin) {
    const msg = error?.response?.data?.message || 'Unable to load dealer dashboard';
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} mb={2}>Dealer Dashboard</Typography>
        <Alert severity="error">{msg}. Ask admin to link your dealer profile or approve your registration.</Alert>
      </Box>
    );
  }

  const stats = data?.stats || {};

  const chartData = {
    labels: data?.monthlySales?.map((m) => m.month) || [],
    datasets: [{
      label: 'Revenue (₹)',
      data: data?.monthlySales?.map((m) => m.revenue) || [],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#6366f1',
      borderWidth: 2,
    }],
  };

  const orderColumns = [
    { field: 'order_number', headerName: 'Order #', flex: 1 },
    { field: 'business_name', headerName: 'Dealer', flex: 1 },
    { field: 'total_amount', headerName: 'Amount', flex: 1, valueFormatter: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
    {
      field: 'status', headerName: 'Status', flex: 1,
      renderCell: (params) => <Chip label={params.value} color={statusColors[params.value] || 'default'} size="small" />,
    },
  ];

  return (
    <Box>
      {/* Page Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700} color="#0f172a">
          {isAdmin ? 'Dashboard' : 'My Dashboard'}
        </Typography>
        <Typography variant="body2" color="#64748b" mt={0.5}>
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}. Here's what's happening.
        </Typography>
      </Box>

      <Grid container spacing={2.5} mb={3}>
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

      {isAdmin && data?.monthlySales?.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Monthly Sales Trend</Typography>
          <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </Paper>
      )}

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
