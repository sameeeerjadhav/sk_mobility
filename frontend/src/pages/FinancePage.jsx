import { useState } from 'react';
import {
  Box, Typography, Grid, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Paper, Tabs, Tab, Alert, Skeleton, LinearProgress, Tooltip,
} from '@mui/material';
import { Add, AccountBalance, CreditCard, Edit } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeAPI } from '../services';
import StatCard from '../components/StatCard';

function AddBankDialog({ open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ bank_name:'', account_number:'', account_type:'current', balance:'', notes:'' });
  const mut = useMutation({ mutationFn: () => financeAPI.createBankAccount(form), onSuccess: () => { qc.invalidateQueries(['finance']); onClose(); } });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>Add Bank Account</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={8}><TextField fullWidth label="Bank Name" value={form.bank_name} onChange={set('bank_name')} required /></Grid>
          <Grid item xs={4}>
            <TextField fullWidth select label="Type" value={form.account_type} onChange={set('account_type')}>
              {['current','savings','overdraft'].map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}><TextField fullWidth label="Account Number" value={form.account_number} onChange={set('account_number')} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Current Balance (₹)" type="number" value={form.balance} onChange={set('balance')} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} /></Grid>
        </Grid>
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || 'Error'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={() => mut.mutate()} variant="contained" disabled={mut.isPending}>{mut.isPending ? 'Adding...' : 'Add Account'}</Button>
      </DialogActions>
    </Dialog>
  );
}

function AddLoanDialog({ open, onClose, bankAccounts }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    lender_name:'', loan_type:'bank', bank_account_id:'', principal_amount:'',
    outstanding_amount:'', interest_rate:'', emi_amount:'', emi_date:'', start_date:'', end_date:'', notes:'',
  });
  const mut = useMutation({ mutationFn: () => financeAPI.createLoan(form), onSuccess: () => { qc.invalidateQueries(['finance']); onClose(); } });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>Add Loan / Debt</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={8}><TextField fullWidth label="Lender Name" value={form.lender_name} onChange={set('lender_name')} required placeholder="e.g. SBI, HDFC, John Doe" /></Grid>
          <Grid item xs={4}>
            <TextField fullWidth select label="Loan Type" value={form.loan_type} onChange={set('loan_type')}>
              {['bank','personal','partner','other'].map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth select label="Linked Bank Account (optional)" value={form.bank_account_id} onChange={set('bank_account_id')}>
              <MenuItem value="">None</MenuItem>
              {(bankAccounts||[]).map(b => <MenuItem key={b.id} value={b.id}>{b.bank_name} ({b.account_type})</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}><TextField fullWidth label="Principal Amount (₹)" type="number" value={form.principal_amount} onChange={set('principal_amount')} required /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Outstanding Amount (₹)" type="number" value={form.outstanding_amount} onChange={set('outstanding_amount')} required /></Grid>
          <Grid item xs={4}><TextField fullWidth label="Interest Rate (%)" type="number" value={form.interest_rate} onChange={set('interest_rate')} /></Grid>
          <Grid item xs={4}><TextField fullWidth label="EMI Amount (₹)" type="number" value={form.emi_amount} onChange={set('emi_amount')} /></Grid>
          <Grid item xs={4}><TextField fullWidth label="EMI Date (day)" type="number" value={form.emi_date} onChange={set('emi_date')} placeholder="e.g. 5" inputProps={{ min:1, max:31 }} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Start Date" type="date" value={form.start_date} onChange={set('start_date')} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="End Date" type="date" value={form.end_date} onChange={set('end_date')} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} /></Grid>
        </Grid>
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || 'Error'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={() => mut.mutate()} variant="contained" disabled={mut.isPending}>{mut.isPending ? 'Saving...' : 'Add Loan'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function FinancePage() {
  const [tab, setTab] = useState(0);
  const [addBank, setAddBank] = useState(false);
  const [addLoan, setAddLoan] = useState(false);

  const { data: stats } = useQuery({ queryKey: ['finance','stats'], queryFn: () => financeAPI.stats().then(r => r.data.data) });
  const { data: bankAccounts = [], isLoading: bLoading } = useQuery({ queryKey: ['finance','banks'], queryFn: () => financeAPI.bankAccounts().then(r => r.data.data) });
  const { data: loans = [], isLoading: lLoading } = useQuery({ queryKey: ['finance','loans'], queryFn: () => financeAPI.loans().then(r => r.data.data) });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0f172a">Bank & Loans</Typography>
          <Typography variant="body2" color="#64748b">Track bank accounts, loans and outstanding debts</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<AccountBalance />} onClick={() => setAddBank(true)}>Add Bank Account</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddLoan(true)}>Add Loan / Debt</Button>
        </Box>
      </Box>

      <Grid container spacing={2.5} mb={3}>
        {[
          { title: 'Total Bank Balance', value: `₹${Number(stats?.total_bank_balance||0).toLocaleString('en-IN')}`, icon: <AccountBalance sx={{ fontSize: 20 }} />, color: '#10b981' },
          { title: 'Total Outstanding Loans', value: `₹${Number(stats?.total_outstanding_loans||0).toLocaleString('en-IN')}`, icon: <CreditCard sx={{ fontSize: 20 }} />, color: '#ef4444' },
          { title: 'Active Loans', value: stats?.active_loans || 0, icon: <CreditCard sx={{ fontSize: 20 }} />, color: '#f59e0b' },
          { title: 'Monthly EMI Total', value: `₹${Number(stats?.monthly_emi_total||0).toLocaleString('en-IN')}`, icon: <CreditCard sx={{ fontSize: 20 }} />, color: '#8b5cf6' },
        ].map(s => <Grid item xs={12} sm={6} md={3} key={s.title}><StatCard {...s} /></Grid>)}
      </Grid>

      <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid #f1f5f9' }}>
          <Tab label="Bank Accounts" />
          <Tab label="Loans & Debts" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            {bLoading ? <Box p={3}><Skeleton height={40} /><Skeleton height={40} /></Box> : (
              <Table>
                <TableHead><TableRow>
                  {['Bank Name','Account Type','Account Number','Balance','Notes'].map(h => <TableCell key={h}>{h}</TableCell>)}
                </TableRow></TableHead>
                <TableBody>
                  {bankAccounts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>No bank accounts added yet.</TableCell></TableRow>
                  ) : bankAccounts.map(b => (
                    <TableRow key={b.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{b.bank_name}</TableCell>
                      <TableCell><Chip label={b.account_type} size="small" variant="outlined" /></TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: '#64748b' }}>{b.account_number || '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#10b981', fontSize: '15px' }}>₹{Number(b.balance).toLocaleString('en-IN')}</TableCell>
                      <TableCell>{b.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                  {bankAccounts.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Total Balance</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#10b981', fontSize: '16px' }}>
                        ₹{bankAccounts.reduce((s,b) => s + parseFloat(b.balance||0), 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ overflowX: 'auto' }}>
            {lLoading ? <Box p={3}><Skeleton height={40} /><Skeleton height={40} /></Box> : (
              <Table>
                <TableHead><TableRow>
                  {['Lender','Type','Principal','Outstanding','Interest','EMI / Date','Status','Repaid'].map(h => <TableCell key={h}>{h}</TableCell>)}
                </TableRow></TableHead>
                <TableBody>
                  {loans.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: '#94a3b8' }}>No loans added yet.</TableCell></TableRow>
                  ) : loans.map(l => {
                    const repaidPct = l.principal_amount > 0
                      ? Math.min(100, ((l.principal_amount - l.outstanding_amount) / l.principal_amount) * 100)
                      : 0;
                    return (
                      <TableRow key={l.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{l.lender_name}</TableCell>
                        <TableCell><Chip label={l.loan_type} size="small" variant="outlined" /></TableCell>
                        <TableCell>₹{Number(l.principal_amount).toLocaleString('en-IN')}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#ef4444' }}>₹{Number(l.outstanding_amount).toLocaleString('en-IN')}</TableCell>
                        <TableCell>{l.interest_rate ? `${l.interest_rate}%` : '—'}</TableCell>
                        <TableCell>
                          {l.emi_amount ? `₹${Number(l.emi_amount).toLocaleString('en-IN')}` : '—'}
                          {l.emi_date ? ` / ${l.emi_date}th` : ''}
                        </TableCell>
                        <TableCell><Chip label={l.status} size="small" color={l.status === 'active' ? 'error' : 'success'} /></TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <Tooltip title={`${repaidPct.toFixed(1)}% repaid`}>
                            <Box>
                              <LinearProgress variant="determinate" value={repaidPct} sx={{ height: 6, borderRadius: 3, bgcolor: '#fee2e2', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
                              <Typography variant="caption" color="#64748b">{repaidPct.toFixed(0)}%</Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
      </Paper>

      <AddBankDialog open={addBank} onClose={() => setAddBank(false)} />
      <AddLoanDialog open={addLoan} onClose={() => setAddLoan(false)} bankAccounts={bankAccounts} />
    </Box>
  );
}
