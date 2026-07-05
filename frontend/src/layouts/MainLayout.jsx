import {
  Box, Drawer, AppBar, Toolbar, Typography, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Avatar, Menu, MenuItem, Badge, Divider,
  useTheme, useMediaQuery, InputBase, alpha, Tooltip, Chip,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Store, DirectionsCar, ShoppingCart, Payment,
  Inventory, People, Build, Logout, Notifications, Receipt,
  AdminPanelSettings, Assessment, Handyman, Search, Settings, ElectricCar,
  Groups, Handshake, AccountBalance, RequestQuote,
} from '@mui/icons-material';
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { logout } from '../store/authSlice';
import { useAuth, isSuperAdmin } from '../hooks/useAuth';
import { notificationsAPI } from '../services';

const DRAWER_WIDTH = 240;

// ── Light sidebar palette (matches 3D Shikshan) ────────────────────────────
const SB = {
  bg:          '#ffffff',
  hover:       'rgba(13,148,136,0.06)',
  active:      'rgba(13,148,136,0.10)',
  activeBorder:'#0d9488',
  activeText:  '#0f766e',
  activeIcon:  '#0d9488',
  text:        '#334155',
  muted:       '#94a3b8',
  label:       '#94a3b8',
  divider:     '#f1f5f9',
  border:      '#e2e8f0',
};

const adminMenu = [
  { section: 'MAIN', items: [
    { text: 'Dashboard',    icon: <Dashboard />,    path: '/dashboard' },
    { text: 'Reports',      icon: <Assessment />,   path: '/reports' },
  ]},
  { section: 'MANAGEMENT', items: [
    { text: 'Dealers',      icon: <Store />,         path: '/dealers' },
    { text: 'Vehicles',     icon: <DirectionsCar />, path: '/vehicles' },
    { text: 'Orders',       icon: <ShoppingCart />,  path: '/orders' },
    { text: 'Leads',        icon: <People />,        path: '/leads' },
  ]},
  { section: 'FINANCE', items: [
    { text: 'Payments',     icon: <Payment />,       path: '/payments' },
    { text: 'Billing',      icon: <Receipt />,       path: '/billing' },
  ]},
  { section: 'OPERATIONS', items: [
    { text: 'Inventory',    icon: <Inventory />,     path: '/inventory' },
    { text: 'Services',     icon: <Build />,         path: '/services' },
    { text: 'Spare Parts',  icon: <Handyman />,      path: '/spare-parts' },
  ]},
  { section: 'BUSINESS', items: [
    { text: 'HR Management',   icon: <Groups />,        path: '/hr' },
    { text: 'Partners',        icon: <Handshake />,     path: '/partners' },
    { text: 'Office Expenses', icon: <RequestQuote />,  path: '/expenses' },
    { text: 'Bank & Loans',    icon: <AccountBalance />,path: '/finance' },
  ]},
  { section: 'SYSTEM', items: [
    { text: 'Admin Panel', icon: <AdminPanelSettings />, path: '/admin' },
  ]},
];

const dealerMenu = [
  { section: 'MAIN', items: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  ]},
  { section: 'BUSINESS', items: [
    { text: 'Vehicles', icon: <DirectionsCar />, path: '/vehicles' },
    { text: 'Orders',   icon: <ShoppingCart />,  path: '/orders' },
    { text: 'Payments', icon: <Payment />,        path: '/payments' },
    { text: 'Leads',    icon: <People />,         path: '/leads' },
  ]},
  { section: 'SERVICE', items: [
    { text: 'Services', icon: <Build />, path: '/services' },
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
  const allItems = menuGroups.flatMap((g) => g.items);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsAPI.unreadCount().then((r) => r.data.data.count),
    refetchInterval: 60000,
  });

  const currentPage = allItems.find((m) => location.pathname.startsWith(m.path))?.text || 'SK Mobility';

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: SB.bg }}>

      {/* ── Logo ── */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${SB.divider}` }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(13,148,136,0.35)',
        }}>
          <ElectricCar sx={{ color: '#fff', fontSize: 18 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            SK Mobility
          </Typography>
          <Typography sx={{ fontSize: '11px', color: SB.muted, lineHeight: 1 }}>
            EV Dealer Platform
          </Typography>
        </Box>
      </Box>

      {/* ── Nav ── */}
      <Box sx={{
        flex: 1, overflowY: 'auto', px: 1.5, py: 2,
        scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
      }}>
        {menuGroups.map((group, gi) => (
          <Box key={group.section} mb={0.5} mt={gi > 0 ? 1.5 : 0}>
            <Typography sx={{
              px: 1, pb: 0.75, pt: 0.25, display: 'block',
              fontWeight: 700, fontSize: '10.5px', color: SB.label,
              letterSpacing: '0.1em', textTransform: 'uppercase',
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
                  sx={{
                    borderRadius: '8px',
                    mb: 0.25, px: 1.25, py: 0.75,
                    backgroundColor: active ? SB.active : 'transparent',
                    borderLeft: active ? `3px solid ${SB.activeBorder}` : '3px solid transparent',
                    '&:hover': { backgroundColor: active ? SB.active : SB.hover },
                    '&.Mui-selected': {
                      backgroundColor: SB.active,
                      '&:hover': { backgroundColor: SB.active },
                    },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: 32,
                    color: active ? SB.activeIcon : SB.muted,
                    transition: 'color 0.15s',
                    '& svg': { fontSize: 18 },
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '13.5px',
                      fontWeight: active ? 700 : 500,
                      color: active ? SB.activeText : SB.text,
                      letterSpacing: '-0.005em',
                    }}
                  />
                </ListItemButton>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* ── Sign Out ── */}
      <Box sx={{ px: 1.5, pb: 2, borderTop: `1px solid ${SB.divider}`, pt: 1.5 }}>
        <ListItemButton
          onClick={() => dispatch(logout()).then(() => navigate('/login'))}
          sx={{
            borderRadius: '8px', px: 1.25, py: 0.85,
            '&:hover': { bgcolor: 'rgba(239,68,68,0.07)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: '#ef4444', '& svg': { fontSize: 18 } }}>
            <Logout />
          </ListItemIcon>
          <ListItemText
            primary="Sign Out"
            primaryTypographyProps={{ fontSize: '13.5px', fontWeight: 600, color: '#ef4444' }}
          />
        </ListItemButton>
      </Box>

      {/* User dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
        PaperProps={{
          sx: {
            mb: 1, minWidth: 200, border: '1px solid #f1f5f9',
            borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {user?.first_name} {user?.last_name}
          </Typography>
          <Typography variant="caption" color="#94a3b8">{user?.email}</Typography>
        </Box>
        <Divider sx={{ borderColor: '#f1f5f9' }} />
        <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }} sx={{ py: 1.2, fontSize: '14px', gap: 1.5 }}>
          <Settings fontSize="small" sx={{ color: '#94a3b8' }} /> Profile & Settings
        </MenuItem>
      </Menu>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0faf8' }}>

      {/* ── AppBar ── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: '#fff',
          color: 'text.primary',
          borderBottom: `1px solid ${SB.border}`,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          zIndex: (t) => t.zIndex.drawer - 1,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <Toolbar sx={{ gap: 1.5, minHeight: '60px !important', px: { xs: 2, md: 3 } }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} size="small"
              sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', width: 34, height: 34 }}
            >
              <MenuIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}

          {/* Search bar */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
            px: 1.5, py: 0.7, flex: 1, maxWidth: 380,
            transition: 'all 0.15s ease',
            '&:focus-within': {
              borderColor: '#0d9488',
              boxShadow: '0 0 0 3px rgba(13,148,136,0.1)',
              bgcolor: '#fff',
            },
          }}>
            <Search sx={{ fontSize: 16, color: '#94a3b8', flexShrink: 0 }} />
            <InputBase
              placeholder="Search orders, dealers, ve..."
              sx={{ fontSize: '13px', color: '#374151', flex: 1 }}
              inputProps={{ 'aria-label': 'global search' }}
            />
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', flexShrink: 0 }}>
              <Typography sx={{ bgcolor: '#e2e8f0', color: '#94a3b8', px: 0.7, py: 0.1, borderRadius: '4px', fontSize: '10.5px', fontWeight: 600 }}>
                ⌘K
              </Typography>
            </Box>
          </Box>

          <Box flex={1} />

          {/* Current page title — desktop */}
          <Typography variant="body2" fontWeight={700} color="#475569"
            sx={{ display: { xs: 'none', md: 'block' } }}
          >
            {currentPage}
          </Typography>

          <Box flex={1} />

          {/* Notifications */}
          <Tooltip title="Notifications" arrow>
            <IconButton
              size="small"
              onClick={() => navigate('/notifications')}
              sx={{
                border: '1px solid #e2e8f0', borderRadius: '8px',
                width: 36, height: 36, transition: 'all 0.15s',
                '&:hover': { borderColor: '#0d9488', bgcolor: 'rgba(13,148,136,0.05)' },
              }}
            >
              <Badge badgeContent={unreadData || 0} color="error">
                <Notifications sx={{ fontSize: 18, color: '#475569' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User pill */}
          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
              border: '1px solid #e2e8f0', borderRadius: '10px',
              pl: 0.75, pr: 1.5, py: 0.5,
              transition: 'all 0.15s',
              '&:hover': { borderColor: '#0d9488', boxShadow: '0 2px 8px rgba(13,148,136,0.12)' },
            }}
          >
            <Avatar sx={{
              width: 28, height: 28,
              bgcolor: '#0d9488',
              fontSize: '11px', fontWeight: 700,
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
            <Typography variant="body2" fontWeight={700}
              sx={{ color: '#0f172a', fontSize: '13px', display: { xs: 'none', sm: 'block' } }}
            >
              {user?.first_name}
            </Typography>
            {isSuperAdmin(user) && (
              <Chip
                label="Admin"
                size="small"
                sx={{ height: 18, fontSize: '10px', bgcolor: alpha('#0d9488', 0.1), color: '#0f766e', display: { xs: 'none', lg: 'flex' } }}
              />
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar ── */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: '#fff', border: 'none', boxShadow: '4px 0 24px rgba(0,0,0,0.1)' } }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: '#fff', borderRight: `1px solid ${SB.border}`, boxShadow: 'none' } }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* ── Main Content ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '60px',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: '#f0faf8',
          minHeight: '100vh',
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: '1600px' }} className="sk-page-enter">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
