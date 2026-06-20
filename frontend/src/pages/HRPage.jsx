import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Paper, Tabs, Tab, Alert, Skeleton, IconButton,
  Tooltip, InputAdornment, DialogContentText,
} from '@mui/material';
import { Add, Edit, Delete, People, AttachMoney, HourglassEmpty, CheckCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrAPI } from '../services';
import StatCard from '../components/StatCard';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DEPARTMENTS = ['Sales','Service','Admin','Finance','Operations','HR','IT','Other'];
const EMPTY_EMP = { first_name:'', last_name:'', email:'', phone:'', department:'Sales', designation:'', salary:'', join_date:'', status:'active' };

// ── Shared Delete Confirm ─────────────────────────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700} color="error.main">{title}</DialogTitle>
      <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading} sx={{ minWidth: 100 }}>
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Employee Dialog (Add + Edit) ──────────────────────────────────────────────
function EmployeeDialog({ open, onClose, editItem }) {
  const qc = useQueryClient();
  const isEdit = !!editItem;
  const [form, setForm] = useState(EMPTY_EMP);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(isEdit ? {
        first_name: editItem.first_name || '', last_name: editItem.last_name || '',
        email: editItem.email || '', phone: editItem.phone || '',
        department: editItem.department || 'Sales', designation: editItem.designation || '',
        salary: editItem.salary || '', join_date: editItem.join_date ? editItem.join_date.slice(0,10) : '',
        status: editItem.status || 'active',
      } : EMPTY_EMP);
      setErrors({});
      mut.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editItem]);

  const mut = useMutation({
    mutationFn: (data) => isEdit ? hrAPI.updateEmployee(editItem.id, data) : hrAPI.createEmployee(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr'] }); setForm(EMPTY_EMP); onClose(); },
  });

  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); };

  const handleSubmit = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Required';
    if (!form.last_name.trim()) errs.last_name = 'Required';
    if (!form.designation.trim()) errs.designation = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    mut.mutate({ ...form, salary: form.salary ? Number(form.salary) : 0 });
  };

  const handleClose = () => { setForm(EMPTY_EMP); setErrors({}); mut.reset(); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>{isEdit ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={6}><TextField fullWidth label="First Name" value={form.first_name} onChange={set('first_name')} required error={!!errors.first_name} helperText={errors.first_name} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Last Name" value={form.last_name} onChange={set('last_name')} required error={!!errors.last_name} helperText={errors.last_name} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} /></Grid>
          <Grid item xs={6}><TextField fullWidth select label="Department" value={form.department} onChange={set('department')}>{DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField></Grid>
          <Grid item xs={6}><TextField fullWidth label="Designation" value={form.designation} onChange={set('designation')} required error={!!errors.designation} helperText={errors.designation} placeholder="e.g. Sales Manager" /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Monthly Salary" type="number" value={form.salary} onChange={set('salary')} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Join Date" type="date" value={form.join_date} onChange={set('join_date')} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6}><TextField fullWidth select label="Status" value={form.status} onChange={set('status')}><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem></TextField></Grid>
        </Grid>
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || mut.error?.message || 'Failed. Try again.'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={mut.isPending}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={mut.isPending} sx={{ minWidth: 130 }}>
          {mut.isPending ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Employee')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Salary Dialog (Add) ───────────────────────────────────────────────────────
function SalaryDialog({ open, onClose, employees }) {
  const qc = useQueryClient();
  const now = new Date();
  const empty = { employee_id:'', month: now.getMonth()+1, year: now.getFullYear(), basic_salary:'', deductions:'0', payment_date:'', notes:'', status:'paid' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => { if (open) { setForm(empty); setErrors({}); mut.reset(); } }, [open]); // eslint-disable-line

  const mut = useMutation({
    mutationFn: (data) => hrAPI.createSalary(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr'] }); onClose(); },
  });

  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); };

  const handleSubmit = () => {
    const errs = {};
    if (!form.employee_id) errs.employee_id = 'Select employee';
    if (!form.basic_salary || Number(form.basic_salary) <= 0) errs.basic_salary = 'Enter valid amount';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    mut.mutate({ ...form, net_salary: Number(form.basic_salary) - Number(form.deductions || 0) });
  };

  const net = Number(form.basic_salary || 0) - Number(form.deductions || 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>Record Salary Payment</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={12}><TextField fullWidth select label="Employee" value={form.employee_id} onChange={set('employee_id')} required error={!!errors.employee_id} helperText={errors.employee_id}>{(employees||[]).length === 0 ? <MenuItem disabled>No employees</MenuItem> : (employees||[]).map(e => <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name} — {e.employee_code}</MenuItem>)}</TextField></Grid>
          <Grid item xs={6}><TextField fullWidth select label="Month" value={form.month} onChange={set('month')}>{MONTHS.map((m,i) => <MenuItem key={i} value={i+1}>{m}</MenuItem>)}</TextField></Grid>
          <Grid item xs={6}><TextField fullWidth label="Year" type="number" value={form.year} onChange={set('year')} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Basic Salary" type="number" value={form.basic_salary} onChange={set('basic_salary')} required error={!!errors.basic_salary} helperText={errors.basic_salary} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Deductions" type="number" value={form.deductions} onChange={set('deductions')} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></Grid>
          {form.basic_salary && <Grid item xs={12}><Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '10px', px: 2, py: 1.5 }}><Typography variant="body2" color="#10b981" fontWeight={700}>Net Pay: ₹{net.toLocaleString('en-IN')}</Typography></Box></Grid>}
          <Grid item xs={6}><TextField fullWidth label="Payment Date" type="date" value={form.payment_date} onChange={set('payment_date')} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6}><TextField fullWidth select label="Status" value={form.status} onChange={set('status')}><MenuItem value="paid">✅ Paid</MenuItem><MenuItem value="pending">⏳ Pending</MenuItem></TextField></Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes (optional)" multiline rows={2} value={form.notes} onChange={set('notes')} /></Grid>
        </Grid>
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || 'Failed. Try again.'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={mut.isPending}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={mut.isPending} sx={{ minWidth: 130 }}>{mut.isPending ? 'Saving...' : 'Save Record'}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main HR Page ──────────────────────────────────────────────────────────────
export default function HRPage() {
  const [tab, setTab] = useState(0);
  const [empDialog, setEmpDialog] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [deleteEmp, setDeleteEmp] = useState(null);
  const [salDialog, setSalDialog] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [deleteSalId, setDeleteSalId] = useState(null);

  const qc = useQueryClient();
  const { data: stats } = useQuery({ queryKey: ['hr','stats'], queryFn: () => hrAPI.stats().then(r => r.data.data) });
  const { data: empData, isLoading: eLoading } = useQuery({ queryKey: ['hr','employees'], queryFn: () => hrAPI.employees().then(r => r.data) });
  const { data: salaryData, isLoading: salLoading } = useQuery({ queryKey: ['hr','salaries', selectedEmpId], queryFn: () => selectedEmpId ? hrAPI.salaries(selectedEmpId).then(r => r.data.data) : Promise.resolve([]), enabled: tab === 1 && !!selectedEmpId });

  const employees = empData?.data || [];
  const salaryRecords = salaryData || [];

  const deleteEmpMut = useMutation({ mutationFn: (id) => hrAPI.deleteEmployee(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr'] }); setDeleteEmp(null); } });
  const deleteSalMut = useMutation({ mutationFn: (id) => hrAPI.deleteSalary(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr','salaries', selectedEmpId] }); setDeleteSalId(null); } });

  const openAdd = () => { setEditEmp(null); setEmpDialog(true); };
  const openEdit = (emp) => { setEditEmp(emp); setEmpDialog(true); };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0f172a">HR Management</Typography>
          <Typography variant="body2" color="#64748b">Manage employees, departments and salaries</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<AttachMoney />} onClick={() => setSalDialog(true)}>Record Salary</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Employee</Button>
        </Box>
      </Box>

      <Grid container spacing={2.5} mb={3}>
        {[
          { title: 'Active Employees', value: stats?.active_employees ?? 0, icon: <People sx={{ fontSize: 20 }} />, color: '#6366f1' },
          { title: 'Total Employees', value: stats?.total_employees ?? 0, icon: <People sx={{ fontSize: 20 }} />, color: '#3b82f6' },
          { title: 'Monthly Payroll', value: `₹${Number(stats?.monthly_payroll||0).toLocaleString('en-IN')}`, icon: <AttachMoney sx={{ fontSize: 20 }} />, color: '#10b981' },
          { title: 'Pending Salaries', value: stats?.pending_salaries ?? 0, icon: <HourglassEmpty sx={{ fontSize: 20 }} />, color: '#f59e0b' },
        ].map(s => <Grid item xs={12} sm={6} md={3} key={s.title}><StatCard {...s} /></Grid>)}
      </Grid>

      <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid #f1f5f9' }}>
          <Tab label="Employees" />
          <Tab label="Salary Records" />
        </Tabs>

        {/* Employees Tab */}
        {tab === 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            {eLoading ? <Box p={3}>{[1,2,3].map(i => <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />)}</Box> : (
              <Table>
                <TableHead><TableRow>{['Code','Name','Department','Designation','Salary','Join Date','Status','Actions'].map(h => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                      <People sx={{ fontSize: 40, color: '#e2e8f0', display: 'block', mx: 'auto', mb: 1 }} />
                      <Button size="small" onClick={openAdd}>Add First Employee</Button>
                    </TableCell></TableRow>
                  ) : employees.map(e => {
                    const hasData = e.first_name && e.first_name.trim();
                    return (
                      <TableRow key={e.id} hover sx={{ opacity: hasData ? 1 : 0.75, bgcolor: hasData ? 'inherit' : 'rgba(239,68,68,0.02)' }}>
                        <TableCell><Chip label={e.employee_code || '—'} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9' }} /></TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {hasData ? `${e.first_name} ${e.last_name}` : (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography sx={{ color: '#ef4444', fontSize: '13px', fontStyle: 'italic' }}>Incomplete — click Edit</Typography>
                              <Tooltip title="Edit to fill in details">
                                <IconButton size="small" onClick={() => openEdit(e)} sx={{ color: '#6366f1', padding: '2px' }}>
                                  <Edit sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>{e.department || '—'}</TableCell>
                        <TableCell>{e.designation || '—'}</TableCell>
                        <TableCell>₹{Number(e.salary||0).toLocaleString('en-IN')}</TableCell>
                        <TableCell>{e.join_date ? new Date(e.join_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                        <TableCell><Chip label={e.status === 'active' ? 'Active' : 'Inactive'} size="small" color={e.status === 'active' ? 'success' : 'default'} icon={e.status === 'active' ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : undefined} /></TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(e)} sx={{ color: '#6366f1', '&:hover': { bgcolor: '#eef2ff' } }}><Edit fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteEmp(e)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}><Delete fontSize="small" /></IconButton></Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

        {/* Salary Tab */}
        {tab === 1 && (
          <Box>
            <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              <TextField select label="Select Employee" value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} size="small" sx={{ minWidth: 240 }}>
                <MenuItem value="">— Select to view records —</MenuItem>
                {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</MenuItem>)}
              </TextField>
              <Button size="small" variant="contained" startIcon={<Add />} onClick={() => setSalDialog(true)}>Record Payment</Button>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead><TableRow>{['Month/Year','Basic Salary','Deductions','Net Pay','Payment Date','Status',''].map(h => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {!selectedEmpId ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94a3b8' }}>Select an employee above to view salary records.</TableCell></TableRow>
                  ) : salLoading ? (
                    <TableRow><TableCell colSpan={7}><Skeleton height={40} /></TableCell></TableRow>
                  ) : salaryRecords.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94a3b8' }}>No salary records for this employee.</TableCell></TableRow>
                  ) : salaryRecords.map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{MONTHS[s.month-1]} {s.year}</TableCell>
                      <TableCell>₹{Number(s.basic_salary).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#ef4444' }}>₹{Number(s.deductions||0).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#10b981' }}>₹{Number(s.net_salary).toLocaleString('en-IN')}</TableCell>
                      <TableCell>{s.payment_date ? new Date(s.payment_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                      <TableCell><Chip label={s.status === 'paid' ? 'Paid' : 'Pending'} size="small" color={s.status === 'paid' ? 'success' : 'warning'} /></TableCell>
                      <TableCell><Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteSalId(s.id)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}><Delete fontSize="small" /></IconButton></Tooltip></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}
      </Paper>

      <EmployeeDialog open={empDialog} onClose={() => { setEmpDialog(false); setEditEmp(null); }} editItem={editEmp} />
      <SalaryDialog open={salDialog} onClose={() => setSalDialog(false)} employees={employees} />
      <ConfirmDialog open={!!deleteEmp} onClose={() => setDeleteEmp(null)} onConfirm={() => deleteEmpMut.mutate(deleteEmp.id)} title="Delete Employee?" message={`Delete ${deleteEmp?.first_name} ${deleteEmp?.last_name}? This will also remove all their salary records.`} loading={deleteEmpMut.isPending} />
      <ConfirmDialog open={!!deleteSalId} onClose={() => setDeleteSalId(null)} onConfirm={() => deleteSalMut.mutate(deleteSalId)} title="Delete Salary Record?" message="This salary record will be permanently deleted." loading={deleteSalMut.isPending} />
    </Box>
  );
}
