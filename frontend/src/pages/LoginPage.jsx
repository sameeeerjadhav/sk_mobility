import { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, Alert, Link, InputAdornment, IconButton,
} from '@mui/material';
import { ElectricCar, Visibility, VisibilityOff } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { login, clearError, fetchProfile } from '../store/authSlice';
import { useAuth } from '../hooks/useAuth';

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
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      bgcolor: '#f8fafc',
    }}>
      {/* Left panel — branding */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        width: '45%',
        background: 'linear-gradient(145deg, #6366f1 0%, #4f46e5 50%, #3730a3 100%)',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 5,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <Box sx={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', top: -100, right: -100,
        }} />
        <Box sx={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', bottom: 50, left: -80,
        }} />

        {/* Logo */}
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '12px',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <ElectricCar sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Typography variant="h6" fontWeight={700} color="#fff">SK Mobility</Typography>
        </Box>

        {/* Headline */}
        <Box>
          <Typography variant="h3" fontWeight={800} color="#fff" sx={{ lineHeight: 1.2, mb: 2 }}>
            Manage your EV dealer network with ease
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', lineHeight: 1.7 }}>
            A complete platform for orders, inventory, payments, service tracking and more — all in one place.
          </Typography>

          {/* Feature pills */}
          <Box display="flex" gap={1} flexWrap="wrap" mt={3}>
            {['Orders', 'Inventory', 'Payments', 'Service', 'Leads', 'Reports'].map(f => (
              <Box key={f} sx={{
                px: 1.5, py: 0.5, bgcolor: 'rgba(255,255,255,0.15)',
                borderRadius: '20px', backdropFilter: 'blur(8px)',
              }}>
                <Typography sx={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>{f}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
          © 2026 SK Mobility. All rights reserved.
        </Typography>
      </Box>

      {/* Right panel — login form */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
      }}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          <Box sx={{ display: { md: 'none' }, mb: 4, textAlign: 'center' }}>
            <Box sx={{
              width: 52, height: 52, borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 1.5, boxShadow: '0 8px 20px rgba(99,102,241,0.4)',
            }}>
              <ElectricCar sx={{ color: '#fff', fontSize: 26 }} />
            </Box>
            <Typography variant="h6" fontWeight={700} color="#0f172a">SK Mobility</Typography>
          </Box>

          <Typography variant="h4" fontWeight={800} color="#0f172a" mb={0.5}>
            Welcome back
          </Typography>
          <Typography sx={{ color: '#64748b', mb: 4, fontSize: '15px' }}>
            Sign in to your account to continue
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box mb={2.5}>
              <Typography variant="body2" fontWeight={600} color="#374151" mb={0.75}>
                Email address
              </Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
              />
            </Box>

            <Box mb={3}>
              <Box display="flex" justifyContent="space-between" mb={0.75}>
                <Typography variant="body2" fontWeight={600} color="#374151">
                  Password
                </Typography>
                <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
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
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
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
              sx={{ py: 1.5, fontSize: '15px' }}
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </Button>
          </form>

          <Box mt={3} textAlign="center">
            <Link component={RouterLink} to="/dealer-register" sx={{
              color: '#6366f1', textDecoration: 'none', fontWeight: 500, fontSize: '14px',
              '&:hover': { textDecoration: 'underline' },
            }}>
              New dealer? Register here →
            </Link>
          </Box>

          {/* Demo credentials */}
          <Box sx={{
            mt: 4, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '12px',
          }}>
            <Typography variant="caption" fontWeight={700} color="#374151" display="block" mb={1}>
              Demo credentials
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Typography variant="caption" color="#64748b">
                Admin: admin@skmobility.com / <strong>password</strong>
              </Typography>
              <Typography variant="caption" color="#64748b">
                Dealer: dealer@skmobility.com / <strong>password</strong>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
