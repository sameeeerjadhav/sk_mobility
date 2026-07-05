import { createTheme, alpha } from '@mui/material/styles';

// ── Color Tokens ─────────────────────────────────────────────────────────────
const T = {
  teal:  { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a' },
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
  green: { 400: '#4ade80', 500: '#22c55e', 600: '#16a34a' },
  red:   { 400: '#f87171', 500: '#ef4444' },
  amber: { 400: '#fbbf24', 500: '#f59e0b' },
  sky:   { 500: '#0ea5e9' },
  indigo:{ 500: '#6366f1' },
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: T.teal[600], light: T.teal[500], dark: T.teal[700], contrastText: '#fff' },
    secondary:  { main: T.green[500], light: T.green[400], dark: T.green[600] },
    background: { default: '#f0faf8', paper: '#ffffff' },
    error:      { main: T.red[500] },
    warning:    { main: T.amber[500] },
    info:       { main: T.sky[500] },
    success:    { main: T.green[500] },
    text:       { primary: T.slate[900], secondary: T.slate[500] },
    divider:    T.slate[200],
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h3: { fontWeight: 800, letterSpacing: '-0.03em' },
    h4: { fontWeight: 800, letterSpacing: '-0.025em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.55, fontSize: '0.875rem' },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.04)',
    '0 2px 4px rgba(0,0,0,0.06)',
    '0 4px 8px -2px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
    '0 8px 16px -4px rgba(0,0,0,0.10), 0 4px 8px -4px rgba(0,0,0,0.06)',
    '0 16px 32px -8px rgba(0,0,0,0.12), 0 8px 16px -8px rgba(0,0,0,0.06)',
    '0 24px 48px -12px rgba(0,0,0,0.18)',
    '0 32px 64px -16px rgba(0,0,0,0.22)',
    ...Array(17).fill('none'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background: #f0faf8; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @keyframes sk-fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .sk-page-enter { animation: sk-fadeUp 0.25s ease both; }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '14px',
          borderRadius: '8px',
          padding: '8px 18px',
          transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
          letterSpacing: '0.01em',
          lineHeight: 1.5,
        },
        contained: {
          background: T.teal[600],
          color: '#fff',
          boxShadow: `0 2px 6px ${alpha(T.teal[600], 0.3)}`,
          '&:hover': {
            background: T.teal[700],
            boxShadow: `0 4px 12px ${alpha(T.teal[600], 0.4)}`,
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)' },
          '&.Mui-disabled': { background: T.slate[200], color: T.slate[400], boxShadow: 'none' },
        },
        outlined: {
          border: `1.5px solid ${T.teal[600]}`,
          color: T.teal[700],
          backgroundColor: 'transparent',
          '&:hover': {
            border: `1.5px solid ${T.teal[700]}`,
            backgroundColor: alpha(T.teal[600], 0.06),
          },
        },
        text: {
          color: T.teal[700],
          '&:hover': { backgroundColor: alpha(T.teal[600], 0.06) },
        },
      },
      defaultProps: { disableElevation: true },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: `1px solid ${T.slate[100]}`,
          borderRadius: 12,
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: `1px solid ${T.slate[100]}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '12px', borderRadius: '6px', height: '24px' },
        colorSuccess: { backgroundColor: alpha(T.green[500], 0.12), color: T.green[600] },
        colorError:   { backgroundColor: alpha(T.red[500], 0.10),  color: T.red[500] },
        colorWarning: { backgroundColor: alpha(T.amber[500], 0.12), color: '#b45309' },
        colorInfo:    { backgroundColor: alpha(T.sky[500], 0.10),   color: '#0369a1' },
        colorPrimary: { backgroundColor: alpha(T.teal[600], 0.10),  color: T.teal[700] },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#fff',
            transition: 'box-shadow 0.15s ease',
            '& fieldset': { borderColor: T.slate[200] },
            '&:hover fieldset': { borderColor: T.teal[400] },
            '&.Mui-focused fieldset': { borderColor: T.teal[600], borderWidth: '2px' },
            '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(T.teal[600], 0.12)}` },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: T.teal[600] },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: T.teal[600], borderWidth: '2px',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          transition: 'all 0.15s ease',
          '&.Mui-selected': {
            backgroundColor: alpha(T.teal[600], 0.1),
            color: T.teal[700],
            '& .MuiListItemIcon-root': { color: T.teal[600] },
            '&:hover': { backgroundColor: alpha(T.teal[600], 0.14) },
          },
          '&:hover': { backgroundColor: alpha(T.teal[600], 0.06) },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: T.slate[50],
            fontWeight: 700,
            fontSize: '11.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: T.slate[500],
            borderBottom: `2px solid ${T.slate[100]}`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${T.slate[100]}`,
          fontSize: '14px',
          padding: '12px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background 0.12s',
          '&:hover': { backgroundColor: alpha(T.teal[600], 0.03) },
          '&:last-child td': { borderBottom: 'none' },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: { paper: { border: 'none', backgroundImage: 'none' } },
    },
    MuiAppBar: {
      styleOverrides: { root: { boxShadow: 'none', backgroundImage: 'none' } },
    },
    MuiAvatar: {
      styleOverrides: { root: { fontSize: '13px', fontWeight: 700 } },
    },
    MuiBadge: {
      styleOverrides: { badge: { fontSize: '10px', fontWeight: 700, minWidth: '18px', height: '18px' } },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: '8px', border: '1px solid' },
        standardError:   { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
        standardSuccess: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
        standardWarning: { borderColor: '#fcd34d', backgroundColor: '#fffbeb' },
        standardInfo:    { borderColor: '#93c5fd', backgroundColor: '#eff6ff' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.12)' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontSize: '18px', fontWeight: 700, paddingBottom: '8px' } },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none', fontWeight: 600, fontSize: '14px', minHeight: '44px',
          '&.Mui-selected': { color: T.teal[700] },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: '3px', borderRadius: '3px 3px 0 0', backgroundColor: T.teal[600] },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', fontWeight: 600, fontSize: '13px',
          borderRadius: '8px !important', border: `1px solid ${T.slate[200]} !important`,
          color: T.slate[600],
          '&.Mui-selected': {
            backgroundColor: alpha(T.teal[600], 0.08),
            color: T.teal[700],
            borderColor: `${T.teal[300]} !important`,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: T.slate[800], fontSize: '12px', fontWeight: 500, borderRadius: '6px', padding: '5px 10px' },
        arrow: { color: T.slate[800] },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 8 },
        thumb: { boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
        track: { borderRadius: 22 },
        switchBase: { '&.Mui-checked': { '& + .MuiSwitch-track': { backgroundColor: T.teal[600] } } },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6 },
        bar: { borderRadius: 4 },
      },
    },
  },
});

export default theme;
