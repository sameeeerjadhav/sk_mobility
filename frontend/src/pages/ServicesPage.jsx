import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton, Tooltip, Alert, CircularProgress,
  Paper, InputAdornment, Avatar,
} from '@mui/material';
import {
  BuildCircle, CheckCircle, HourglassTop, PendingActions, Add, Search,
  Refresh, Close, Assignment, Engineering,
} from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesAPI } from '../services';

const TEAL = '#0d9488';
const TEAL_LIGHT = 'rgba(13,148,136,0.08)';

const STATUS_COLORS = {
  requested: 'info', scheduled: 'primary', in_progress: 'warning',
  completed: 'success', cancelled: 'error',
};
const STATUSES = ['requested', 'scheduled', 'in_progress', 'completed', 'cancelled'];
const SERVICE_TYPES = ['general_service', 'repair', 'inspection', 'battery_check', 'software_update', 'warranty_repair', 'accidental_repair'];

function StatCard({ icon, label, value, color = TEAL }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
          <Box sx={{ color, display: 'flex' }}>{icon}</Box>
        </Box>
        <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</Typography>
        <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.5 }}>{label}</Typography>
      </CardContent>
    </Card>
  );
}

export default function ServicesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [jobCardOpen, setJobCardOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [jobForm, setJobForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: servData, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesAPI.list().then((r) => r.data),
  });
  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => servicesAPI.technicians().then((r) => r.data.data || []),
  });

  const services = servData?.data || [];

  const stats = useMemo(() => ({
    total: services.length,
    pending: services.filter((s) => s.status === 'requested').length,
    inProgress: services.filter((s) => s.status === 'in_progress').length,
    completed: services.filter((s) => s.status === 'completed').length,
  }), [services]);

  const filtered = useMemo(() => {
    let rows = services;
    if (filterStatus) rows = rows.filter((r) => r.status === filterStatus);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((r) =>
        r.customer_name?.toLowerCase().includes(s) ||
        r.request_number?.toLowerCase().includes(s) ||
        r.vin_number?.toLowerCase().includes(s)
      );
    }
    return rows;
  }, [services, filterStatus, search]);

  const notify = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const createMut = useMutation({
    mutationFn: (data) => servicesAPI.create(data),
    onSuccess: () => { qc.invalidateQueries(['services']); setCreateOpen(false); setForm({}); notify('Service request created'); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to create request'),
  });

  const jobCardMut = useMutation({
    mutationFn: ({ id, data }) => servicesAPI.createJobCard(id, data),
    onSuccess: () => { qc.invalidateQueries(['services']); setJobCardOpen(false); setSelected(null); setJobForm({}); notify('Job card created'); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to create job card'),
  });

  const openCreate = () => { setForm({ status: 'requested' }); setError(''); setCreateOpen(true); };
  const openJobCard = (svc) => { setSelected(svc); setJobForm({ status: 'open' }); setError(''); setJobCardOpen(true); };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Service Management</Typography>
          <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.25 }}>Track EV service requests and job cards</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
          New Service Request
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}><StatCard icon={<BuildCircle />} label="Total Requests" value={stats.total} /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<PendingActions />} label="Pending" value={stats.pending} color="#f59e0b" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<HourglassTop />} label="In Progress" value={stats.inProgress} color="#0ea5e9" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Completed" value={stats.completed} color="#16a34a" /></Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search customer, request#, VIN..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 200, maxWidth: 360 }}
          />
          <TextField select size="small" label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="">All Statuses</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</MenuItem>)}
          </TextField>
          <Tooltip title="Refresh"><IconButton size="small" onClick={() => qc.invalidateQueries(['services'])}><Refresh fontSize="small" /></IconButton></Tooltip>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Request #', 'Customer', 'Service Type', 'Vehicle / VIN', 'Technician', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.06em' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={28} sx={{ color: TEAL }} /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <BuildCircle sx={{ fontSize: 40, color: '#e2e8f0', display: 'block', mx: 'auto', mb: 1 }} />
                    <Typography color="text.secondary" fontSize={14}>No service requests found</Typography>
                    <Button size="small" sx={{ mt: 1, color: TEAL }} onClick={openCreate}>Create First Request</Button>
                  </TableCell>
                </TableRow>
              ) : filtered.map((svc) => (
                <TableRow key={svc.id} hover>
                  <TableCell><Chip label={svc.request_number} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', fontSize: 11 }} /></TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: TEAL, fontSize: 11 }}>{svc.customer_name?.[0]}</Avatar>
                      <Box>
                        <Typography fontSize={13} fontWeight={600}>{svc.customer_name}</Typography>
                        <Typography fontSize={11} color="text.secondary">{svc.customer_phone}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography fontSize={12} sx={{ textTransform: 'capitalize' }}>{svc.service_type?.replace('_', ' ')}</Typography></TableCell>
                  <TableCell>
                    <Typography fontSize={12} fontWeight={600}>{svc.vehicle_name}</Typography>
                    <Typography fontSize={11} color="text.secondary" sx={{ fontFamily: 'monospace' }}>{svc.vin_number}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#475569' }}>{svc.technician_name || <Typography fontSize={11} color="text.secondary">Unassigned</Typography>}</TableCell>
                  <TableCell>
                    <Chip label={svc.status?.replace('_', ' ')} color={STATUS_COLORS[svc.status] || 'default'} size="small" sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Create / View Job Card">
                      <IconButton size="small" onClick={() => openJobCard(svc)} sx={{ color: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}>
                        <Assignment sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Service Request Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}><Engineering sx={{ color: TEAL }} /> New Service Request</Box>
          <IconButton size="small" onClick={() => setCreateOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Customer Name *" value={form.customer_name || ''} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone *" value={form.customer_phone || ''} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="VIN Number *" value={form.vin_number || ''} onChange={(e) => setForm({ ...form, vin_number: e.target.value })} size="small" placeholder="Vehicle Identification Number" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Service Type *" value={form.service_type || ''} onChange={(e) => setForm({ ...form, service_type: e.target.value })} size="small">
                {SERVICE_TYPES.map((t) => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Assign Technician" value={form.technician_id || ''} onChange={(e) => setForm({ ...form, technician_id: e.target.value })} size="small">
                <MenuItem value="">Unassigned</MenuItem>
                {technicians.map((t) => <MenuItem key={t.id} value={t.id}>{t.name} ({t.specialization || 'General'})</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Scheduled Date" type="date" value={form.scheduled_date || ''} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Issue Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} size="small" multiline rows={3} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={createMut.isPending}
            onClick={() => {
              if (!form.customer_name || !form.customer_phone || !form.vin_number || !form.service_type)
                return setError('Customer name, phone, VIN, and service type are required');
              createMut.mutate(form);
            }}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            {createMut.isPending ? 'Creating...' : 'Create Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Job Card Dialog */}
      <Dialog open={jobCardOpen} onClose={() => setJobCardOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}><Assignment sx={{ color: TEAL }} /> Create Job Card</Box>
          <IconButton size="small" onClick={() => setJobCardOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          {selected && (
            <Alert severity="info" icon={false}>
              Service: <strong>{selected.request_number}</strong> — {selected.customer_name} — {selected.service_type?.replace(/_/g, ' ')}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Assign Technician" value={jobForm.technician_id || ''} onChange={(e) => setJobForm({ ...jobForm, technician_id: e.target.value })} size="small">
                {technicians.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Job Status" value={jobForm.status || 'open'} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })} size="small">
                {['open', 'in_progress', 'completed', 'on_hold'].map((s) => <MenuItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Estimated Hours" type="number" value={jobForm.estimated_hours || ''} onChange={(e) => setJobForm({ ...jobForm, estimated_hours: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Labor Cost (₹)" type="number" value={jobForm.labor_cost || ''} onChange={(e) => setJobForm({ ...jobForm, labor_cost: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Diagnosis / Notes" value={jobForm.notes || ''} onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })} size="small" multiline rows={3} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setJobCardOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={jobCardMut.isPending}
            onClick={() => jobCardMut.mutate({ id: selected?.id, data: jobForm })}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            {jobCardMut.isPending ? 'Creating...' : 'Create Job Card'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
