import { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, Alert, Link, InputAdornment, IconButton,
} from '@mui/material';
import {
  ElectricCar, Visibility, VisibilityOff, CheckCircle,
  Speed, BarChart, Inventory2, People,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { login, clearError, fetchProfile } from '../store/authSlice';
import { useAuth } from '../hooks/useAuth';

const FEATURES = [
  { icon: <Speed sx={{ fontSize: 18 }} />, text: 'Real-time order & inventory tracking' },
  { icon: <BarChart sx={{ fontSize: 18 }} />, text: 'Powerful analytics & reports' },
  { icon: <Inventory2 sx={{ fontSize: 18 }} />, text: 'Multi-warehouse stock management' },
  { icon: <People sx={{ fontSize: 18 }} />, text: 'Dealer network management' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    return () => dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password })).then(async (result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        await dispatch(fetchProfile());
        navigate('/dashboard');
      }
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#f0f4ff' }}>

      {/* ── Left Branding Panel ── */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        width: '48%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 5,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(155deg, #0f2a27 0%, #134e4a 40%, #0f766e 70%, #0d9488 100%)',
      }}>
        {/* Animated blobs */}
        <Box sx={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,148,136,0.35) 0%, transparent 70%)',
          top: -150, right: -150,
          animation: 'sk-pulse-ring 4s ease-in-out infinite',
        }} />
        <Box sx={{
          position: 'absolute', width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.25) 0%, transparent 70%)',
          bottom: 100, left: -100,
          animation: 'sk-pulse-ring 5s ease-in-out infinite 1.5s',
        }} />
        <Box sx={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)',
          bottom: '40%', right: '10%',
          animation: 'sk-pulse-ring 6s ease-in-out infinite 0.5s',
        }} />
        {/* Grid pattern overlay */}
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Logo */}
        <Box display="flex" alignItems="center" gap={1.5} sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '14px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(13,148,136,0.4)',
          }}>
            <ElectricCar sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '18px', color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              SK Mobility
            </Typography>
            <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              EV Dealer Platform
            </Typography>
          </Box>
        </Box>

        {/* Hero Text */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            bgcolor: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.35)',
            borderRadius: '100px', px: 1.5, py: 0.5, mb: 3,
          }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#5eead4', animation: 'sk-pulse-ring 2s ease infinite' }} />
            <Typography sx={{ fontSize: '12px', color: '#99f6e4', fontWeight: 600, letterSpacing: '0.05em' }}>
              LIVE PLATFORM
            </Typography>
          </Box>

          <Typography sx={{
            fontSize: { md: '2.2rem', lg: '2.6rem' },
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            mb: 2,
          }}>
            Manage your EV<br />
            <Box component="span" sx={{
              background: 'linear-gradient(90deg, #5eead4 0%, #4ade80 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              dealer network
            </Box>
            <br />with confidence.
          </Typography>

          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.75, mb: 4, maxWidth: 380 }}>
            One platform for orders, inventory, billing, HR, service tracking and more.
          </Typography>

          {/* Feature list */}
          <Box display="flex" flexDirection="column" gap={1.5}>
            {FEATURES.map((f, i) => (
              <Box key={i} display="flex" alignItems="center" gap={1.5}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                  bgcolor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#5eead4',
                }}>
                  {f.icon}
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', fontWeight: 500 }}>
                  {f.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', position: 'relative', zIndex: 1 }}>
          © 2026 SK Mobility. All rights reserved.
        </Typography>
      </Box>

      {/* ── Right Form Panel ── */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
        position: 'relative',
        bgcolor: '#f0f4ff',
      }}>
        {/* Subtle background decoration */}
        <Box sx={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 70%)',
          top: -200, right: -200, pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,148,136,0.05) 0%, transparent 70%)',
          bottom: -100, left: -100, pointerEvents: 'none',
        }} />

        <Box sx={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

          {/* Mobile logo */}
          <Box sx={{ display: { md: 'none' }, mb: 5, textAlign: 'center' }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: '16px',
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2, boxShadow: '0 8px 24px rgba(13,148,136,0.4)',
            }}>
              <ElectricCar sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
            <Typography variant="h6" fontWeight={800} color="#0f172a">SK Mobility</Typography>
            <Typography variant="caption" color="#94a3b8">EV Dealer Platform</Typography>
          </Box>

          {/* Card */}
          <Box sx={{
            bgcolor: '#fff',
            borderRadius: '24px',
            p: { xs: 3, sm: 4 },
            boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 10px 40px rgba(13,148,136,0.1)',
            border: '1px solid rgba(226,232,240,0.8)',
          }}>
            <Typography sx={{ fontWeight: 800, fontSize: '26px', color: '#0f172a', letterSpacing: '-0.025em', mb: 0.5 }}>
              Welcome back 👋
            </Typography>
            <Typography sx={{ color: '#64748b', mb: 3.5, fontSize: '14.5px' }}>
              Sign in to your SK Mobility account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box mb={2.5}>
                <Typography variant="body2" fontWeight={700} color="#374151" mb={0.75} fontSize="13px">
                  Email address
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  size="small"
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: '10px',
                      '&.Mui-focused fieldset': { borderColor: '#0d9488' }
                    } 
                  }}
                />
              </Box>

              <Box mb={3.5}>
                <Box display="flex" justifyContent="space-between" mb={0.75}>
                  <Typography variant="body2" fontWeight={700} color="#374151" fontSize="13px">
                    Password
                  </Typography>
                  <Link component={RouterLink} to="/forgot-password" sx={{
                    color: '#0d9488', textDecoration: 'none', fontWeight: 600, fontSize: '13px',
                    '&:hover': { textDecoration: 'underline' },
                  }}>
                    Forgot password?
                  </Link>
                </Box>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  size="small"
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: '10px',
                      '&.Mui-focused fieldset': { borderColor: '#0d9488' }
                    } 
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.4, fontSize: '15px', fontWeight: 700, borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                  boxShadow: '0 4px 16px rgba(13,148,136,0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                    boxShadow: '0 6px 20px rgba(13,148,136,0.5)',
                    transform: 'translateY(-1px)',
                  },
                  letterSpacing: '-0.01em',
                }}
              >
                {loading ? 'Signing in...' : 'Sign in →'}
              </Button>
            </form>

            <Box mt={3} textAlign="center">
              <Link component={RouterLink} to="/dealer-register" sx={{
                color: '#0d9488', textDecoration: 'none', fontWeight: 600, fontSize: '13.5px',
                '&:hover': { textDecoration: 'underline' },
              }}>
                New dealer? Request access →
              </Link>
            </Box>
          </Box>

          {/* Demo credentials */}
          <Box sx={{
            mt: 2.5, p: 2, bgcolor: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(226,232,240,0.8)',
            borderRadius: '14px',
          }}>
            <Typography variant="caption" fontWeight={700} color="#374151" display="block" mb={1}>
              🔑 Demo credentials
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle sx={{ fontSize: 13, color: '#10b981' }} />
                <Typography variant="caption" color="#64748b">
                  Admin: <strong>admin@skmobility.com</strong> / <strong>password</strong>
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle sx={{ fontSize: 13, color: '#6366f1' }} />
                <Typography variant="caption" color="#64748b">
                  Dealer: <strong>dealer@skmobility.com</strong> / <strong>password</strong>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
