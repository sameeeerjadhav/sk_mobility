import { useState } from 'react';
import {
  Box, Typography, Grid, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Paper, Tabs, Tab, Alert, Skeleton,
} from '@mui/material';
import { Add, Handshake, TrendingUp, TrendingDown, AccountBalance } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnersAPI } from '../services';
import StatCard from '../components/StatCard';

function AddPartnerDialog({ open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', type: 'partner', phone: '', email: '', notes: '' });
  const mut = useMutation({ mutationFn: () => partnersAPI.create(form), onSuccess: () => { qc.invalidateQueries(['partners']); onClose(); } });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>Add Partner</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={8}><TextField fullWidth label="Partner Name" value={form.name} onChange={set('name')} required /></Grid>
          <Grid item xs={4}>
            <TextField fullWidth select label="Type" value={form.type} onChange={set('type')}>
              {['partner','investor','supplier','other'].map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}><TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} /></Grid>
        </Grid>
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || 'Error'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={() => mut.mutate()} variant="contained" disabled={mut.isPending}>{mut.isPending ? 'Adding...' : 'Add Partner'}</Button>
      </DialogActions>
    </Dialog>
  );
}

function AddTransactionDialog({ open, onClose, partners }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ partner_id: '', type: 'given', amount: '', date: new Date().toISOString().slice(0,10), description: '' });
  const mut = useMutation({ mutationFn: () => partnersAPI.createTransaction(form), onSuccess: () => { qc.invalidateQueries(['partners']); onClose(); } });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>Record Transaction</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={12}>
            <TextField fullWidth select label="Partner" value={form.partner_id} onChange={set('partner_id')} required>
              {(partners||[]).map(p => <MenuItem key={p.id} value={p.id}>{p.name} ({p.type})</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Type" value={form.type} onChange={set('type')}>
              <MenuItem value="given">💸 Money Given (to partner)</MenuItem>
              <MenuItem value="received">💰 Money Received (from partner)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}><TextField fullWidth label="Amount (₹)" type="number" value={form.amount} onChange={set('amount')} required /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Date" type="date" value={form.date} onChange={set('date')} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Description" value={form.description} onChange={set('description')} /></Grid>
        </Grid>
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || 'Error'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={() => mut.mutate()} variant="contained" disabled={mut.isPending}>{mut.isPending ? 'Saving...' : 'Save Transaction'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PartnersPage() {
  const [tab, setTab] = useState(0);
  const [addPartner, setAddPartner] = useState(false);
  const [addTx, setAddTx] = useState(false);

  const { data: stats, isLoading: sLoading } = useQuery({ queryKey: ['partners','stats'], queryFn: () => partnersAPI.stats().then(r => r.data.data) });
  const { data: partners = [], isLoading: pLoading } = useQuery({ queryKey: ['partners','list'], queryFn: () => partnersAPI.list().then(r => r.data.data) });
  const { data: txData, isLoading: tLoading } = useQuery({ queryKey: ['partners','transactions'], queryFn: () => partnersAPI.allTransactions().then(r => r.data) });
  const transactions = txData?.data || [];

  const netBalance = parseFloat(stats?.net_balance || 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0f172a">Partner Transactions</Typography>
          <Typography variant="body2" color="#64748b">Track money given/received from business partners</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Handshake />} onClick={() => setAddPartner(true)}>Add Partner</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddTx(true)}>Record Transaction</Button>
        </Box>
      </Box>

      <Grid container spacing={2.5} mb={3}>
        {[
          { title: 'Total Partners', value: sLoading ? '—' : stats?.total_partners || 0, icon: <Handshake sx={{ fontSize: 20 }} />, color: '#6366f1' },
          { title: 'Total Given', value: sLoading ? '—' : `₹${Number(stats?.total_given||0).toLocaleString('en-IN')}`, icon: <TrendingUp sx={{ fontSize: 20 }} />, color: '#ef4444' },
          { title: 'Total Received', value: sLoading ? '—' : `₹${Number(stats?.total_received||0).toLocaleString('en-IN')}`, icon: <TrendingDown sx={{ fontSize: 20 }} />, color: '#10b981' },
          { title: 'Net Balance', value: sLoading ? '—' : `₹${Math.abs(netBalance).toLocaleString('en-IN')}`, icon: <AccountBalance sx={{ fontSize: 20 }} />, color: netBalance >= 0 ? '#10b981' : '#ef4444', subtitle: netBalance >= 0 ? 'In your favour' : 'You owe' },
        ].map(s => <Grid item xs={12} sm={6} md={3} key={s.title}><StatCard {...s} /></Grid>)}
      </Grid>

      <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid #f1f5f9' }}>
          <Tab label="Partners" />
          <Tab label="All Transactions" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            {pLoading ? <Box p={3}><Skeleton height={40} /><Skeleton height={40} /></Box> : (
              <Table>
                <TableHead><TableRow>
                  {['Name','Type','Phone','Total Given','Total Received','Net'].map(h => <TableCell key={h}>{h}</TableCell>)}
                </TableRow></TableHead>
                <TableBody>
                  {partners.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8' }}>No partners yet. Add your first partner.</TableCell></TableRow>
                  ) : partners.map(p => {
                    const net = parseFloat(p.total_received) - parseFloat(p.total_given);
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                        <TableCell><Chip label={p.type} size="small" variant="outlined" /></TableCell>
                        <TableCell>{p.phone || '—'}</TableCell>
                        <TableCell sx={{ color: '#ef4444' }}>₹{Number(p.total_given).toLocaleString('en-IN')}</TableCell>
                        <TableCell sx={{ color: '#10b981' }}>₹{Number(p.total_received).toLocaleString('en-IN')}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: net >= 0 ? '#10b981' : '#ef4444' }}>
                          {net >= 0 ? '+' : '-'}₹{Math.abs(net).toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ overflowX: 'auto' }}>
            {tLoading ? <Box p={3}><Skeleton height={40} /><Skeleton height={40} /></Box> : (
              <Table>
                <TableHead><TableRow>
                  {['Date','Partner','Type','Amount','Description'].map(h => <TableCell key={h}>{h}</TableCell>)}
                </TableRow></TableHead>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>No transactions yet.</TableCell></TableRow>
                  ) : transactions.map(tx => (
                    <TableRow key={tx.id} hover>
                      <TableCell>{new Date(tx.date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tx.partner_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={tx.type === 'given' ? '💸 Given' : '💰 Received'}
                          size="small"
                          sx={{ bgcolor: tx.type === 'given' ? '#fef2f2' : '#f0fdf4', color: tx.type === 'given' ? '#ef4444' : '#10b981', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: tx.type === 'given' ? '#ef4444' : '#10b981' }}>
                        {tx.type === 'given' ? '-' : '+'}₹{Number(tx.amount).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>{tx.description || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
      </Paper>

      <AddPartnerDialog open={addPartner} onClose={() => setAddPartner(false)} />
      <AddTransactionDialog open={addTx} onClose={() => setAddTx(false)} partners={partners} />
    </Box>
  );
}
