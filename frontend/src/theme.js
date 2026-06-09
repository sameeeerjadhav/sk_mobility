import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#10b981', light: '#34d399', dark: '#059669' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info: { main: '#3b82f6' },
    success: { main: '#10b981' },
    text: { primary: '#0f172a', secondary: '#64748b' },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.5 },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,0.05)',
    '0 1px 3px 0 rgba(0,0,0,0.1),0 1px 2px -1px rgba(0,0,0,0.1)',
    '0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1)',
    '0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1)',
    '0 20px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    ...Array(19).fill('none'),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '14px',
          borderRadius: '10px',
          padding: '8px 18px',
          transition: 'all 0.2s ease',
          lineHeight: 1.5,
          letterSpacing: '0.01em',
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          border: 'none',
          color: '#fff',
          boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
            boxShadow: '0 4px 12px rgba(99,102,241,0.5)',
            transform: 'translateY(-1px)',
          },
          '&.Mui-disabled': {
            background: '#e2e8f0',
            color: '#94a3b8',
            boxShadow: 'none',
          },
        },
        outlined: {
          border: '1.5px solid #e2e8f0',
          color: '#374151',
          backgroundColor: '#ffffff',
          '&:hover': {
            border: '1.5px solid #6366f1',
            color: '#6366f1',
            backgroundColor: alpha('#6366f1', 0.04),
          },
        },
        text: {
          color: '#6366f1',
          '&:hover': {
            backgroundColor: alpha('#6366f1', 0.06),
          },
        },
      },
      defaultProps: { disableElevation: true },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)',
          border: '1px solid #f1f5f9',
          borderRadius: 16,
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px 0 rgba(0,0,0,0.10)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)',
          border: '1px solid #f1f5f9',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '12px',
          borderRadius: '8px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            '& fieldset': { borderColor: '#e2e8f0' },
            '&:hover fieldset': { borderColor: '#6366f1' },
            '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '1.5px' },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          transition: 'all 0.15s ease',
          '&.Mui-selected': {
            backgroundColor: alpha('#6366f1', 0.1),
            color: '#6366f1',
            '& .MuiListItemIcon-root': { color: '#6366f1' },
            '&:hover': { backgroundColor: alpha('#6366f1', 0.15) },
          },
          '&:hover': {
            backgroundColor: alpha('#0f172a', 0.04),
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#f8fafc',
            fontWeight: 600,
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            borderBottom: '1px solid #e2e8f0',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f1f5f9',
          fontSize: '14px',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          boxShadow: '1px 0 0 0 #f1f5f9',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #f1f5f9',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '13px',
          fontWeight: 700,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontSize: '10px',
          fontWeight: 700,
          minWidth: '18px',
          height: '18px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          border: '1px solid',
        },
        standardError: {
          borderColor: '#fca5a5',
          backgroundColor: '#fef2f2',
        },
        standardSuccess: {
          borderColor: '#6ee7b7',
          backgroundColor: '#f0fdf4',
        },
        standardWarning: {
          borderColor: '#fcd34d',
          backgroundColor: '#fffbeb',
        },
        standardInfo: {
          borderColor: '#93c5fd',
          backgroundColor: '#eff6ff',
        },
      },
    },
  },
});

export default theme;
