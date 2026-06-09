import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Avatar, Menu, MenuItem, Badge, Divider,
  useTheme, useMediaQuery, InputBase, alpha, Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Store, DirectionsCar, ShoppingCart, Payment,
  Inventory, People, Build, Logout, Notifications, Receipt,
  AdminPanelSettings, Assessment, Handyman, Search, Settings, ElectricCar,
} from '@mui/icons-material';
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { logout } from '../store/authSlice';
import { useAuth, isSuperAdmin } from '../hooks/useAuth';
import { notificationsAPI } from '../services';

const DRAWER_WIDTH = 256;

const adminMenu = [
  { section: 'MAIN', items: [
    { text: 'Dashboard', icon: <Dashboard fontSize="small" />, path: '/dashboard' },
    { text: 'Reports', icon: <Assessment fontSize="small" />, path: '/reports' },
  ]},
  { section: 'MANAGEMENT', items: [
    { text: 'Dealers', icon: <Store fontSize="small" />, path: '/dealers' },
    { text: 'Vehicles', icon: <DirectionsCar fontSize="small" />, path: '/vehicles' },
    { text: 'Orders', icon: <ShoppingCart fontSize="small" />, path: '/orders' },
    { text: 'Leads', icon: <People fontSize="small" />, path: '/leads' },
  ]},
  { section: 'FINANCE', items: [
    { text: 'Payments', icon: <Payment fontSize="small" />, path: '/payments' },
    { text: 'Billing', icon: <Receipt fontSize="small" />, path: '/billing' },
  ]},
  { section: 'OPERATIONS', items: [
    { text: 'Inventory', icon: <Inventory fontSize="small" />, path: '/inventory' },
    { text: 'Services', icon: <Build fontSize="small" />, path: '/services' },
    { text: 'Spare Parts', icon: <Handyman fontSize="small" />, path: '/spare-parts' },
  ]},
  { section: 'SYSTEM', items: [
    { text: 'Admin', icon: <AdminPanelSettings fontSize="small" />, path: '/admin' },
  ]},
];

const dealerMenu = [
  { section: 'MAIN', items: [
    { text: 'Dashboard', icon: <Dashboard fontSize="small" />, path: '/dashboard' },
  ]},
  { section: 'BUSINESS', items: [
    { text: 'Vehicles', icon: <DirectionsCar fontSize="small" />, path: '/vehicles' },
    { text: 'Orders', icon: <ShoppingCart fontSize="small" />, path: '/orders' },
    { text: 'Payments', icon: <Payment fontSize="small" />, path: '/payments' },
    { text: 'Leads', icon: <People fontSize="small" />, path: '/leads' },
  ]},
  { section: 'SERVICE', items: [
    { text: 'Services', icon: <Build fontSize="small" />, path: '/services' },
  ]},
];

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const menuGroups = isSuperAdmin(user) ? adminMenu : dealerMenu;
  const allItems = menuGroups.flatMap(g => g.items);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsAPI.unreadCount().then((r) => r.data.data.count),
    refetchInterval: 60000,
  });

  const currentPage = allItems.find((m) => location.pathname.startsWith(m.path))?.text || 'SK Mobility';

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(99,102,241,0.4)',
        }}>
          <ElectricCar sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2, color: '#0f172a' }}>
            SK Mobility
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', lineHeight: 1 }}>
            EV Dealer Platform
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#f1f5f9' }} />

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1.5 }}>
        {menuGroups.map((group) => (
          <Box key={group.section} mb={0.5}>
            <Typography variant="caption" sx={{
              px: 1.5, py: 0.5, display: 'block', fontWeight: 700,
              fontSize: '10.5px', color: '#94a3b8', letterSpacing: '0.08em',
            }}>
              {group.section}
            </Typography>
            {group.items.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
                <ListItemButton
                  key={item.path}
                  selected={active}
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  sx={{ borderRadius: '10px', mb: 0.25, px: 1.5, py: 0.85 }}
                >
                  <ListItemIcon sx={{
                    minWidth: 34,
                    color: active ? '#6366f1' : '#94a3b8',
                    transition: 'color 0.15s',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '14px',
                      fontWeight: active ? 600 : 500,
                      color: active ? '#0f172a' : '#475569',
                    }}
                  />
                  {active && (
                    <Box sx={{
                      width: 6, height: 6, borderRadius: '50%',
                      bgcolor: '#6366f1', flexShrink: 0,
                    }} />
                  )}
                </ListItemButton>
              );
            })}
            <Box mb={1} />
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: '#f1f5f9' }} />

      {/* User profile at bottom */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          fontSize: '13px', fontWeight: 700,
        }}>
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#0f172a', fontSize: '13px' }}>
            {user?.first_name} {user?.last_name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px' }} noWrap>
            {user?.role || 'User'}
          </Typography>
        </Box>
        <Tooltip title="Logout">
          <IconButton
            size="small"
            onClick={() => dispatch(logout()).then(() => navigate('/login'))}
            sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}
          >
            <Logout fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'rgba(248,250,252,0.9)',
          backdropFilter: 'blur(12px)',
          color: 'text.primary',
          borderBottom: '1px solid #f1f5f9',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ gap: 2, minHeight: '60px !important' }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} size="small">
              <MenuIcon />
            </IconButton>
          )}

          {/* Search */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
            px: 1.5, py: 0.6, flex: 1, maxWidth: 380,
          }}>
            <Search sx={{ fontSize: 18, color: '#94a3b8' }} />
            <InputBase
              placeholder="Search..."
              sx={{ fontSize: '14px', color: '#374151', flex: 1 }}
              inputProps={{ 'aria-label': 'search' }}
            />
            <Typography variant="caption" sx={{
              display: { xs: 'none', sm: 'block' },
              color: '#94a3b8', bgcolor: '#f1f5f9', px: 0.8, py: 0.2, borderRadius: '4px', fontSize: '11px',
            }}>
              Ctrl+K
            </Typography>
          </Box>

          <Box flex={1} />

          {/* Page title on mobile */}
          <Typography variant="subtitle1" fontWeight={600} sx={{ display: { md: 'none' }, color: '#0f172a' }}>
            {currentPage}
          </Typography>

          <Box flex={1} sx={{ display: { xs: 'none', md: 'block' } }} />

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="small"
              onClick={() => navigate('/notifications')}
              sx={{
                bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
                width: 36, height: 36,
                '&:hover': { bgcolor: '#f8fafc', borderColor: '#6366f1' },
              }}
            >
              <Badge badgeContent={unreadData || 0} color="error">
                <Notifications sx={{ fontSize: 18, color: '#374151' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Avatar */}
          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
              bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
              px: 1.2, py: 0.6,
              '&:hover': { borderColor: '#6366f1', bgcolor: '#fafaf9' },
              transition: 'all 0.2s',
            }}
          >
            <Avatar sx={{
              width: 26, height: 26,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              fontSize: '11px', fontWeight: 700,
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
            <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a', fontSize: '13px', display: { xs: 'none', sm: 'block' } }}>
              {user?.first_name}
            </Typography>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1, minWidth: 180, border: '1px solid #f1f5f9',
                borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" fontWeight={600} color="#0f172a">
                {user?.first_name} {user?.last_name}
              </Typography>
              <Typography variant="caption" color="#94a3b8">{user?.email}</Typography>
            </Box>
            <Divider sx={{ borderColor: '#f1f5f9' }} />
            <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }} sx={{ py: 1.2, fontSize: '14px', gap: 1.5 }}>
              <Settings fontSize="small" sx={{ color: '#94a3b8' }} /> Profile & Settings
            </MenuItem>
            <MenuItem
              onClick={() => dispatch(logout()).then(() => navigate('/login'))}
              sx={{ py: 1.2, fontSize: '14px', gap: 1.5, color: '#ef4444' }}
            >
              <Logout fontSize="small" /> Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', boxShadow: '4px 0 24px rgba(0,0,0,0.08)' } }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', boxShadow: '1px 0 0 0 #f1f5f9' } }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '60px',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: '#f8fafc',
          minHeight: '100vh',
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
