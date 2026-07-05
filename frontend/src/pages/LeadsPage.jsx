import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton, Tooltip, Alert, CircularProgress,
  Paper, InputAdornment, Avatar, Collapse,
} from '@mui/material';
import {
  PersonAdd, TrendingUp, CheckCircle, Groups, Search, Refresh,
  Close, Edit, ExpandMore, ExpandLess, AddComment, PhoneInTalk,
} from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsAPI } from '../services';

const TEAL = '#0d9488';
const TEAL_LIGHT = 'rgba(13,148,136,0.08)';

const STATUS_COLORS = {
  new: 'info', contacted: 'default', interested: 'primary',
  test_drive: 'secondary', negotiation: 'warning', converted: 'success', lost: 'error',
};
const STATUSES = ['new', 'contacted', 'interested', 'test_drive', 'negotiation', 'converted', 'lost'];

function StatCard({ icon, label, value, color = TEAL, sub }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
          <Box sx={{ color, display: 'flex' }}>{icon}</Box>
        </Box>
        <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</Typography>
        <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.5 }}>{label}</Typography>
        {sub && <Typography sx={{ fontSize: 11, color, mt: 0.5, fontWeight: 600 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function LeadsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsAPI.list().then((r) => r.data),
  });
  const { data: sources = [] } = useQuery({
    queryKey: ['lead-sources'],
    queryFn: () => leadsAPI.sources().then((r) => r.data.data || []),
  });

  const leads = leadsData?.data || [];

  const stats = useMemo(() => {
    const converted = leads.filter((l) => l.status === 'converted').length;
    return {
      total: leads.length,
      newLeads: leads.filter((l) => l.status === 'new').length,
      converted,
      rate: leads.length ? Math.round((converted / leads.length) * 100) : 0,
    };
  }, [leads]);

  const filtered = useMemo(() => {
    let rows = leads;
    if (filterStatus) rows = rows.filter((r) => r.status === filterStatus);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((r) => r.customer_name?.toLowerCase().includes(s) || r.customer_phone?.includes(s) || r.lead_number?.toLowerCase().includes(s));
    }
    return rows;
  }, [leads, filterStatus, search]);

  const notify = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const createMut = useMutation({
    mutationFn: (data) => leadsAPI.create(data),
    onSuccess: () => { qc.invalidateQueries(['leads']); setAddOpen(false); setForm({}); notify('Lead created successfully'); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to create lead'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status, notes }) => leadsAPI.updateStatus(id, { status, notes }),
    onSuccess: () => { qc.invalidateQueries(['leads']); setStatusOpen(false); setSelected(null); notify('Lead status updated'); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to update status'),
  });

  const followupMut = useMutation({
    mutationFn: ({ id, notes, next_followup_date }) => leadsAPI.addFollowup ? leadsAPI.addFollowup(id, { notes, next_followup_date }) : Promise.resolve(),
    onSuccess: () => { qc.invalidateQueries(['leads']); setFollowupOpen(false); setSelected(null); notify('Follow-up added'); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to add follow-up'),
  });

  const openAdd = () => { setForm({ status: 'new' }); setError(''); setAddOpen(true); };
  const openStatus = (lead) => { setSelected(lead); setForm({ status: lead.status }); setError(''); setStatusOpen(true); };
  const openFollowup = (lead) => { setSelected(lead); setForm({}); setError(''); setFollowupOpen(true); };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Lead Management</Typography>
          <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.25 }}>Track and convert customer inquiries</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={openAdd}
          sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
          Add Lead
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}><StatCard icon={<Groups />} label="Total Leads" value={stats.total} /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<PersonAdd />} label="New Leads" value={stats.newLeads} color="#0ea5e9" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Converted" value={stats.converted} color="#16a34a" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<TrendingUp />} label="Conversion Rate" value={`${stats.rate}%`} color={stats.rate > 20 ? '#16a34a' : '#f59e0b'} /></Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search name, phone, lead#..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 200, maxWidth: 360 }}
          />
          <TextField select size="small" label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="">All Statuses</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</MenuItem>)}
          </TextField>
          <Tooltip title="Refresh"><IconButton size="small" onClick={() => qc.invalidateQueries(['leads'])}><Refresh fontSize="small" /></IconButton></Tooltip>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Lead #', 'Customer', 'Phone', 'Source', 'Interest', 'Status', 'Actions'].map((h) => (
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
                    <Groups sx={{ fontSize: 40, color: '#e2e8f0', display: 'block', mx: 'auto', mb: 1 }} />
                    <Typography color="text.secondary" fontSize={14}>No leads found</Typography>
                    <Button size="small" sx={{ mt: 1, color: TEAL }} onClick={openAdd}>Add First Lead</Button>
                  </TableCell>
                </TableRow>
              ) : filtered.map((lead) => (
                <>
                  <TableRow key={lead.id} hover>
                    <TableCell><Chip label={lead.lead_number} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', fontSize: 11 }} /></TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: TEAL, fontSize: 11 }}>
                          {lead.customer_name?.[0]}
                        </Avatar>
                        <Typography fontSize={13} fontWeight={600}>{lead.customer_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: 13 }}>{lead.customer_phone}</TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: 12 }}>{lead.source_name || '—'}</TableCell>
                    <TableCell sx={{ fontSize: 12, maxWidth: 140 }}><Typography noWrap fontSize={12}>{lead.vehicle_interest || '—'}</Typography></TableCell>
                    <TableCell>
                      <Chip
                        label={lead.status?.replace('_', ' ')}
                        color={STATUS_COLORS[lead.status] || 'default'}
                        size="small"
                        onClick={() => openStatus(lead)}
                        sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="Update Status">
                          <IconButton size="small" onClick={() => openStatus(lead)} sx={{ color: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}>
                            <Edit sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Add Follow-up">
                          <IconButton size="small" onClick={() => openFollowup(lead)} sx={{ color: '#0ea5e9', '&:hover': { bgcolor: 'rgba(14,165,233,0.08)' } }}>
                            <AddComment sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={expandedRow === lead.id ? 'Collapse' : 'Show Details'}>
                          <IconButton size="small" onClick={() => setExpandedRow(expandedRow === lead.id ? null : lead.id)}
                            sx={{ color: '#94a3b8' }}>
                            {expandedRow === lead.id ? <ExpandLess sx={{ fontSize: 15 }} /> : <ExpandMore sx={{ fontSize: 15 }} />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                  {expandedRow === lead.id && (
                    <TableRow key={`${lead.id}-detail`}>
                      <TableCell colSpan={7} sx={{ py: 0, bgcolor: '#fafafa' }}>
                        <Collapse in={expandedRow === lead.id}>
                          <Box sx={{ p: 2, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {lead.customer_email && <Box><Typography variant="caption" color="text.secondary">Email</Typography><Typography fontSize={13}>{lead.customer_email}</Typography></Box>}
                            {lead.dealer_name && <Box><Typography variant="caption" color="text.secondary">Dealer</Typography><Typography fontSize={13}>{lead.dealer_name}</Typography></Box>}
                            {lead.notes && <Box><Typography variant="caption" color="text.secondary">Notes</Typography><Typography fontSize={13}>{lead.notes}</Typography></Box>}
                            {lead.next_followup_date && <Box><Typography variant="caption" color="text.secondary">Next Follow-up</Typography><Typography fontSize={13}>{new Date(lead.next_followup_date).toLocaleDateString('en-IN')}</Typography></Box>}
                            {lead.created_at && <Box><Typography variant="caption" color="text.secondary">Created</Typography><Typography fontSize={13}>{new Date(lead.created_at).toLocaleDateString('en-IN')}</Typography></Box>}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Lead Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Add New Lead
          <IconButton size="small" onClick={() => setAddOpen(false)}><Close fontSize="small" /></IconButton>
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
              <TextField fullWidth label="Email" value={form.customer_email || ''} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Source" value={form.source_id || ''} onChange={(e) => setForm({ ...form, source_id: e.target.value })} size="small">
                {sources.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Vehicle Interest" value={form.vehicle_interest || ''} onChange={(e) => setForm({ ...form, vehicle_interest: e.target.value })} size="small" placeholder="e.g., OLA S1 Pro" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Initial Status" value={form.status || 'new'} onChange={(e) => setForm({ ...form, status: e.target.value })} size="small">
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Next Follow-up Date" type="date" value={form.next_followup_date || ''} onChange={(e) => setForm({ ...form, next_followup_date: e.target.value })} size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} size="small" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={createMut.isPending}
            onClick={() => { if (!form.customer_name || !form.customer_phone) return setError('Name and phone are required'); createMut.mutate(form); }}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            {createMut.isPending ? 'Creating...' : 'Create Lead'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusOpen} onClose={() => setStatusOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Update Lead Status
          <IconButton size="small" onClick={() => setStatusOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <Typography variant="body2" color="text.secondary">Lead: <strong>{selected?.customer_name}</strong></Typography>
          <TextField select fullWidth label="New Status" value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })} size="small">
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} size="small" multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setStatusOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={statusMut.isPending}
            onClick={() => statusMut.mutate({ id: selected?.id, status: form.status, notes: form.notes })}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            {statusMut.isPending ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Follow-up Dialog */}
      <Dialog open={followupOpen} onClose={() => setFollowupOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}><PhoneInTalk sx={{ color: TEAL }} /> Add Follow-up</Box>
          <IconButton size="small" onClick={() => setFollowupOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <Typography variant="body2" color="text.secondary">Lead: <strong>{selected?.customer_name}</strong></Typography>
          <TextField fullWidth label="Follow-up Notes *" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} size="small" multiline rows={3} />
          <TextField fullWidth label="Next Follow-up Date" type="date" value={form.next_followup_date || ''} onChange={(e) => setForm({ ...form, next_followup_date: e.target.value })} size="small" InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setFollowupOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={followupMut.isPending}
            onClick={() => { if (!form.notes) return setError('Notes are required'); followupMut.mutate({ id: selected?.id, ...form }); }}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            {followupMut.isPending ? 'Saving...' : 'Save Follow-up'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
