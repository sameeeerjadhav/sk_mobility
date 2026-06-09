import { Box, Typography, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const sparklinePath = (values, w = 80, h = 32) => {
  if (!values || values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  return `M ${pts.join(' L ')}`;
};

export default function StatCard({ title, value, subtitle, icon, color = '#6366f1', trend, loading, sparkline }) {
  if (loading) {
    return (
      <Box sx={{ bgcolor: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', p: 2.5 }}>
        <Skeleton height={16} width="60%" sx={{ mb: 1 }} />
        <Skeleton height={36} width="80%" sx={{ mb: 1 }} />
        <Skeleton height={32} />
      </Box>
    );
  }

  const bgLight = `${color}14`;

  return (
    <Box sx={{
      bgcolor: '#fff',
      border: '1px solid #f1f5f9',
      borderRadius: '16px',
      p: 2.5,
      height: '100%',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      '&:hover': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)',
      },
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#64748b', lineHeight: 1.4 }}>
          {title}
        </Typography>
        {icon && (
          <Box sx={{
            width: 38, height: 38, borderRadius: '10px',
            bgcolor: bgLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
            flexShrink: 0,
          }}>
            {icon}
          </Box>
        )}
      </Box>

      <Typography sx={{
        fontSize: { xs: '1.5rem', sm: '1.75rem' },
        fontWeight: 700,
        color: '#0f172a',
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        mb: 0.75,
        wordBreak: 'break-word',
      }}>
        {value}
      </Typography>

      {subtitle && (
        <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>{subtitle}</Typography>
      )}

      <Box display="flex" alignItems="center" justifyContent="space-between" mt={1.5}>
        {trend !== undefined ? (
          <Box display="flex" alignItems="center" gap={0.5}>
            {trend >= 0
              ? <TrendingUp sx={{ fontSize: 14, color: '#10b981' }} />
              : <TrendingDown sx={{ fontSize: 14, color: '#ef4444' }} />
            }
            <Typography sx={{
              fontSize: '12px', fontWeight: 600,
              color: trend >= 0 ? '#10b981' : '#ef4444',
            }}>
              {trend >= 0 ? '+' : ''}{Math.abs(trend)}% from last month
            </Typography>
          </Box>
        ) : <Box />}

        {/* Sparkline */}
        {sparkline && sparkline.length > 1 && (
          <svg width="80" height="32" style={{ overflow: 'visible' }}>
            <path
              d={sparklinePath(sparkline)}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </Box>
    </Box>
  );
}
