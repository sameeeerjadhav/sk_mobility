import { useState } from 'react';
import {
  Box, Typography, Grid, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Paper, Tabs, Tab, IconButton, Tooltip, Alert, Skeleton,
} from '@mui/material';
import { Add, Edit, People, AttachMoney, CheckCircle, HourglassEmpty } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrAPI } from '../services';
import StatCard from '../components/StatCard';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DEPARTMENTS = ['Sales','Service','Admin','Finance','Operations','HR','IT','Other'];

function AddEmployeeDialog({ open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', phone:'', department:'Sales', designation:'', salary:'', join_date:'', status:'active' });
  const mut = useMutation({ mutationFn: () => hrAPI.createEmployee(form), onSuccess: () => { qc.invalidateQueries(['hr']); onClose(); } });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>Add Employee</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={6}><TextField fullWidth label="First Name" value={form.first_name} onChange={set('first_name')} required /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Last Name" value={form.last_name} onChange={set('last_name')} required /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} /></Grid>
          <Grid item xs={6}><TextField fullWidth select label="Department" value={form.department} onChange={set('department')}>{DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField></Grid>
          <Grid item xs={6}><TextField fullWidth label="Designation" value={form.designation} onChange={set('designation')} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Monthly Salary (₹)" type="number" value={form.salary} onChange={set('salary')} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Join Date" type="date" value={form.join_date} onChange={set('join_date')} InputLabelProps={{ shrink: true }} /></Grid>
        </Grid>
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || 'Error'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={() => mut.mutate()} variant="contained" disabled={mut.isPending}>
          {mut.isPending ? 'Adding...' : 'Add Employee'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AddSalaryDialog({ open, onClose, employees }) {
  const qc = useQueryClient();
  const now = new Date();
  const [form, setForm] = useState({ employee_id:'', month: now.getMonth()+1, year: now.getFullYear(), basic_salary:'', deductions:'0', payment_date:'', notes:'', status:'paid' });
  const mut = useMutation({ mutationFn: () => hrAPI.createSalary(form), onSuccess: () => { qc.invalidateQueries(['hr']); onClose(); } });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>Record Salary Payment</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={12}><TextField fullWidth select label="Employee" value={form.employee_id} onChange={set('employee_id')} required>{(employees||[]).map(e => <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</MenuItem>)}</TextField></Grid>
          <Grid item xs={6}><TextField fullWidth select label="Month" value={form.month} onChange={set('month')}>{MONTHS.map((m,i) => <MenuItem key={i} value={i+1}>{m}</MenuItem>)}</TextField></Grid>
          <Grid item xs={6}><TextField fullWidth label="Year" type="number" value={form.year} onChange={set('year')} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Basic Salary (₹)" type="number" value={form.basic_salary} onChange={set('basic_salary')} required /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Deductions (₹)" type="number" value={form.deductions} onChange={set('deductions')} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Payment Date" type="date" value={form.payment_date} onChange={set('payment_date')} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6}><TextField fullWidth select label="Status" value={form.status} onChange={set('status')}><MenuItem value="paid">Paid</MenuItem><MenuItem value="pending">Pending</MenuItem></TextField></Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} /></Grid>
        </Grid>
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || 'Error'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={() => mut.mutate()} variant="contained" disabled={mut.isPending}>{mut.isPending ? 'Saving...' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function HRPage() {
  const [tab, setTab] = useState(0);
  const [addEmp, setAddEmp] = useState(false);
  const [addSal, setAddSal] = useState(false);

  const { data: stats, isLoading: sLoading } = useQuery({ queryKey: ['hr','stats'], queryFn: () => hrAPI.stats().then(r => r.data.data) });
  const { data: empData, isLoading: eLoading } = useQuery({ queryKey: ['hr','employees'], queryFn: () => hrAPI.employees().then(r => r.data) });
  const employees = empData?.data || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0f172a">HR Management</Typography>
          <Typography variant="body2" color="#64748b">Manage employees, departments and salaries</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<AttachMoney />} onClick={() => setAddSal(true)}>Record Salary</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddEmp(true)}>Add Employee</Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} mb={3}>
        {[
          { title: 'Active Employees', value: sLoading ? '—' : stats?.active_employees || 0, icon: <People sx={{ fontSize: 20 }} />, color: '#6366f1' },
          { title: 'Total Employees', value: sLoading ? '—' : stats?.total_employees || 0, icon: <People sx={{ fontSize: 20 }} />, color: '#3b82f6' },
          { title: 'Monthly Payroll', value: sLoading ? '—' : `₹${Number(stats?.monthly_payroll||0).toLocaleString('en-IN')}`, icon: <AttachMoney sx={{ fontSize: 20 }} />, color: '#10b981' },
          { title: 'Pending Salaries', value: sLoading ? '—' : stats?.pending_salaries || 0, icon: <HourglassEmpty sx={{ fontSize: 20 }} />, color: '#f59e0b' },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.title}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid #f1f5f9' }}>
          <Tab label="Employees" />
          <Tab label="Salary Records" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            {eLoading ? <Box p={3}><Skeleton height={40} /><Skeleton height={40} /><Skeleton height={40} /></Box> : (
              <Table>
                <TableHead><TableRow>
                  {['Code','Name','Department','Designation','Salary','Join Date','Status'].map(h => <TableCell key={h}>{h}</TableCell>)}
                </TableRow></TableHead>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94a3b8' }}>No employees yet. Add your first employee.</TableCell></TableRow>
                  ) : employees.map(e => (
                    <TableRow key={e.id} hover>
                      <TableCell><Chip label={e.employee_code} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9' }} /></TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{e.first_name} {e.last_name}</TableCell>
                      <TableCell>{e.department}</TableCell>
                      <TableCell>{e.designation}</TableCell>
                      <TableCell>₹{Number(e.salary).toLocaleString('en-IN')}</TableCell>
                      <TableCell>{e.join_date ? new Date(e.join_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                      <TableCell><Chip label={e.status} size="small" color={e.status === 'active' ? 'success' : 'default'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Box p={2} display="flex" justifyContent="flex-end">
              <Button size="small" variant="contained" startIcon={<Add />} onClick={() => setAddSal(true)}>Record Payment</Button>
            </Box>
            <Table>
              <TableHead><TableRow>
                {['Employee','Month/Year','Basic','Deductions','Net Pay','Payment Date','Status'].map(h => <TableCell key={h}>{h}</TableCell>)}
              </TableRow></TableHead>
              <TableBody>
                {employees.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94a3b8' }}>No salary records yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      <AddEmployeeDialog open={addEmp} onClose={() => setAddEmp(false)} />
      <AddSalaryDialog open={addSal} onClose={() => setAddSal(false)} employees={employees} />
    </Box>
  );
}
