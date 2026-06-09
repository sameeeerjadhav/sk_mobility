import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link } from '@mui/material';
import { DirectionsCar } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { login, clearError, fetchProfile } from '../store/authSlice';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ bgcolor: 'primary.main', background: 'linear-gradient(135deg, #0D47A1 0%, #002171 100%)' }}>
      <Card sx={{ maxWidth: 420, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <DirectionsCar sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>SK Mobility</Typography>
            <Typography color="text.secondary" variant="body2">Dealer Management & Service Platform</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required autoComplete="email" />
            <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required autoComplete="current-password" />
            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 2, py: 1.5 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Box mt={2} textAlign="center">
            <Link component={RouterLink} to="/forgot-password" variant="body2">Forgot password?</Link>
          </Box>
          <Box mt={1} textAlign="center">
            <Link component={RouterLink} to="/dealer-register" variant="body2">Register as Dealer</Link>
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={3}>
            Admin: admin@skmobility.com / password<br />
            Dealer: dealer@skmobility.com / password
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
