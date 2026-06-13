import { useState } from 'react';
import {
  Box, Typography, Grid, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Paper, IconButton, Tooltip, Alert, Skeleton,
} from '@mui/material';
import { Add, Delete, Receipt, CalendarMonth, Category } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesAPI } from '../services';
import StatCard from '../components/StatCard';

function AddExpenseDialog({ open, onClose, categories }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    category_id: '', amount: '', date: new Date().toISOString().slice(0, 10),
    description: '', paid_by: '',
  });
  const mut = useMutation({ mutationFn: () => expensesAPI.create(form), onSuccess: () => { qc.invalidateQueries(['expenses']); onClose(); setForm({ category_id:'', amount:'', date: new Date().toISOString().slice(0,10), description:'', paid_by:'' }); } });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>Add Expense</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={12}>
            <TextField fullWidth select label="Category" value={form.category_id} onChange={set('category_id')} required>
              {(categories || []).map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}><TextField fullWidth label="Amount (₹)" type="number" value={form.amount} onChange={set('amount')} required /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Date" type="date" value={form.date} onChange={set('date')} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={set('description')} multiline rows={2} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Paid By" value={form.paid_by} onChange={set('paid_by')} placeholder="e.g. Cash, Bank Account, Name" /></Grid>
        </Grid>
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || 'Error'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={() => mut.mutate()} variant="contained" disabled={mut.isPending}>{mut.isPending ? 'Adding...' : 'Add Expense'}</Button>
      </DialogActions>
    </Dialog>
  );
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ExpensesPage() {
  const now = new Date();
  const [addOpen, setAddOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const { data: stats } = useQuery({ queryKey: ['expenses','stats'], queryFn: () => expensesAPI.stats().then(r => r.data.data) });
  const { data: categories = [] } = useQuery({ queryKey: ['expenses','categories'], queryFn: () => expensesAPI.categories().then(r => r.data.data) });
  const { data: expData, isLoading } = useQuery({
    queryKey: ['expenses','list', filterMonth, filterYear],
    queryFn: () => expensesAPI.list({ month: filterMonth, year: filterYear }).then(r => r.data),
  });

  const qc = useQueryClient();
  const deleteMut = useMutation({ mutationFn: (id) => expensesAPI.delete(id), onSuccess: () => qc.invalidateQueries(['expenses']) });
  const expenses = expData?.data || [];

  // Group by category for summary
  const byCat = expenses.reduce((acc, e) => {
    acc[e.category_name] = (acc[e.category_name] || 0) + parseFloat(e.amount);
    return acc;
  }, {});

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0f172a">Office Expenses</Typography>
          <Typography variant="body2" color="#64748b">Track all office and operational expenses</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)}>Add Expense</Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} mb={3}>
        {[
          { title: 'This Month', value: `₹${Number(stats?.this_month||0).toLocaleString('en-IN')}`, icon: <CalendarMonth sx={{ fontSize: 20 }} />, color: '#6366f1' },
          { title: 'This Year', value: `₹${Number(stats?.this_year||0).toLocaleString('en-IN')}`, icon: <Receipt sx={{ fontSize: 20 }} />, color: '#3b82f6' },
          { title: 'Total All Time', value: `₹${Number(stats?.total_all_time||0).toLocaleString('en-IN')}`, icon: <Receipt sx={{ fontSize: 20 }} />, color: '#8b5cf6' },
          { title: 'Entries This Month', value: stats?.entries_this_month || 0, icon: <Category sx={{ fontSize: 20 }} />, color: '#f59e0b' },
        ].map(s => <Grid item xs={12} sm={6} md={3} key={s.title}><StatCard {...s} /></Grid>)}
      </Grid>

      {/* Category breakdown */}
      {Object.keys(byCat).length > 0 && (
        <Box mb={3} display="flex" gap={1} flexWrap="wrap">
          {Object.entries(byCat).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
            <Chip key={cat} label={`${cat}: ₹${Number(amt).toLocaleString('en-IN')}`} variant="outlined" size="small" sx={{ fontWeight: 600 }} />
          ))}
        </Box>
      )}

      {/* Filters */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <TextField select label="Month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} size="small" sx={{ minWidth: 120 }}>
          {MONTH_NAMES.map((m, i) => <MenuItem key={i} value={i+1}>{m}</MenuItem>)}
        </TextField>
        <TextField select label="Year" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} size="small" sx={{ minWidth: 100 }}>
          {[2024,2025,2026,2027].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </TextField>
      </Box>

      <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        {isLoading ? <Box p={3}>{[1,2,3,4].map(i => <Skeleton key={i} height={40} sx={{ mb: 1 }} />)}</Box> : (
          <Table>
            <TableHead><TableRow>
              {['Date','Category','Description','Paid By','Amount',''].map(h => <TableCell key={h}>{h}</TableCell>)}
            </TableRow></TableHead>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8' }}>No expenses recorded for this period.</TableCell></TableRow>
              ) : expenses.map(exp => (
                <TableRow key={exp.id} hover>
                  <TableCell>{new Date(exp.date).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell><Chip label={exp.category_name || 'Uncategorized'} size="small" variant="outlined" /></TableCell>
                  <TableCell>{exp.description || '—'}</TableCell>
                  <TableCell>{exp.paid_by || '—'}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#ef4444' }}>₹{Number(exp.amount).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => deleteMut.mutate(exp.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {expenses.length > 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#ef4444', fontSize: '15px' }}>
                    ₹{expenses.reduce((s, e) => s + parseFloat(e.amount), 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <AddExpenseDialog open={addOpen} onClose={() => setAddOpen(false)} categories={categories} />
    </Box>
  );
}
