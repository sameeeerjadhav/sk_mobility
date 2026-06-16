import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Paper, Tabs, Tab, Alert, Skeleton, InputAdornment,
} from '@mui/material';
import { Add, People, AttachMoney, HourglassEmpty, CheckCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrAPI } from '../services';
import StatCard from '../components/StatCard';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DEPARTMENTS = ['Sales','Service','Admin','Finance','Operations','HR','IT','Other'];

const EMPTY_EMP = { first_name:'', last_name:'', email:'', phone:'', department:'Sales', designation:'', salary:'', join_date:'', status:'active' };
const EMPTY_SAL = (now) => ({ employee_id:'', month: now.getMonth()+1, year: now.getFullYear(), basic_salary:'', deductions:'0', payment_date:'', notes:'', status:'paid' });

// ── Add Employee Dialog ──────────────────────────────────────────────────────

function AddEmployeeDialog({ open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_EMP);
  const [errors, setErrors] = useState({});

  const mut = useMutation({
    mutationFn: (data) => hrAPI.createEmployee(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr'] });
      setForm(EMPTY_EMP);
      setErrors({});
      onClose();
    },
  });

  // Reset form and errors every time dialog opens
  useEffect(() => {
    if (open) {
      setForm(EMPTY_EMP);
      setErrors({});
      mut.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Required';
    if (!form.last_name.trim()) errs.last_name = 'Required';
    if (!form.designation.trim()) errs.designation = 'Required';
    if (form.salary && isNaN(Number(form.salary))) errs.salary = 'Must be a number';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    mut.mutate({
      ...form,
      salary: form.salary ? Number(form.salary) : 0,
    });
  };

  const handleClose = () => {
    setForm(EMPTY_EMP);
    setErrors({});
    mut.reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>Add New Employee</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={6}>
            <TextField
              fullWidth label="First Name" value={form.first_name}
              onChange={set('first_name')} required
              error={!!errors.first_name} helperText={errors.first_name}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="Last Name" value={form.last_name}
              onChange={set('last_name')} required
              error={!!errors.last_name} helperText={errors.last_name}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Department" value={form.department} onChange={set('department')}>
              {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="Designation / Role" value={form.designation}
              onChange={set('designation')} required
              error={!!errors.designation} helperText={errors.designation}
              placeholder="e.g. Sales Manager"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="Monthly Salary" type="number" value={form.salary}
              onChange={set('salary')}
              error={!!errors.salary} helperText={errors.salary}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="Join Date" type="date" value={form.join_date}
              onChange={set('join_date')} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Status" value={form.status} onChange={set('status')}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {mut.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {mut.error?.response?.data?.message || mut.error?.message || 'Failed to add employee. Please try again.'}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={mut.isPending}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={mut.isPending} sx={{ minWidth: 130 }}>
          {mut.isPending ? 'Adding...' : 'Add Employee'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Add Salary Dialog ────────────────────────────────────────────────────────

function AddSalaryDialog({ open, onClose, employees }) {
  const qc = useQueryClient();
  const now = new Date();
  const [form, setForm] = useState(EMPTY_SAL(now));
  const [errors, setErrors] = useState({});

  const mut = useMutation({
    mutationFn: (data) => hrAPI.createSalary(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr'] });
      setForm(EMPTY_SAL(new Date()));
      setErrors({});
      onClose();
    },
  });

  useEffect(() => {
    if (open) {
      setForm(EMPTY_SAL(new Date()));
      setErrors({});
      mut.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.employee_id) errs.employee_id = 'Select an employee';
    if (!form.basic_salary || Number(form.basic_salary) <= 0) errs.basic_salary = 'Enter valid salary';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const net = Number(form.basic_salary) - Number(form.deductions || 0);
    mut.mutate({ ...form, net_salary: net });
  };

  const handleClose = () => {
    setForm(EMPTY_SAL(new Date()));
    setErrors({});
    mut.reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>Record Salary Payment</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={12}>
            <TextField
              fullWidth select label="Employee" value={form.employee_id}
              onChange={set('employee_id')} required
              error={!!errors.employee_id} helperText={errors.employee_id}
            >
              {(employees || []).length === 0
                ? <MenuItem disabled>No employees found</MenuItem>
                : (employees || []).map(e => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.first_name} {e.last_name} — {e.employee_code}
                    </MenuItem>
                  ))
              }
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Month" value={form.month} onChange={set('month')}>
              {MONTHS.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Year" type="number" value={form.year} onChange={set('year')} inputProps={{ min: 2020, max: 2099 }} />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="Basic Salary" type="number" value={form.basic_salary}
              onChange={set('basic_salary')} required
              error={!!errors.basic_salary} helperText={errors.basic_salary}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="Deductions" type="number" value={form.deductions}
              onChange={set('deductions')}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
          </Grid>
          {/* Net Pay preview */}
          {form.basic_salary && (
            <Grid item xs={12}>
              <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '10px', px: 2, py: 1.5 }}>
                <Typography variant="body2" color="#10b981" fontWeight={700}>
                  Net Pay: ₹{(Number(form.basic_salary || 0) - Number(form.deductions || 0)).toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Grid>
          )}
          <Grid item xs={6}>
            <TextField fullWidth label="Payment Date" type="date" value={form.payment_date} onChange={set('payment_date')} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Status" value={form.status} onChange={set('status')}>
              <MenuItem value="paid">✅ Paid</MenuItem>
              <MenuItem value="pending">⏳ Pending</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Notes (optional)" multiline rows={2} value={form.notes} onChange={set('notes')} />
          </Grid>
        </Grid>

        {mut.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {mut.error?.response?.data?.message || mut.error?.message || 'Failed to save. Please try again.'}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={mut.isPending}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={mut.isPending} sx={{ minWidth: 130 }}>
          {mut.isPending ? 'Saving...' : 'Save Record'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function HRPage() {
  const [tab, setTab] = useState(0);
  const [addEmp, setAddEmp] = useState(false);
  const [addSal, setAddSal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');

  const { data: stats, isLoading: sLoading } = useQuery({
    queryKey: ['hr', 'stats'],
    queryFn: () => hrAPI.stats().then(r => r.data.data),
  });

  const { data: empData, isLoading: eLoading } = useQuery({
    queryKey: ['hr', 'employees'],
    queryFn: () => hrAPI.employees().then(r => r.data),
  });

  const employees = empData?.data || [];

  // Fetch salary records for selected employee (or all if none selected)
  const { data: salaryData, isLoading: salLoading } = useQuery({
    queryKey: ['hr', 'salaries', selectedEmpId],
    queryFn: () => selectedEmpId
      ? hrAPI.salaries(selectedEmpId).then(r => r.data.data)
      : Promise.resolve([]),
    enabled: tab === 1 && !!selectedEmpId,
  });

  const salaryRecords = salaryData || [];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0f172a">HR Management</Typography>
          <Typography variant="body2" color="#64748b">Manage employees, departments and salaries</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<AttachMoney />} onClick={() => setAddSal(true)}>
            Record Salary
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddEmp(true)}>
            Add Employee
          </Button>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2.5} mb={3}>
        {[
          { title: 'Active Employees', value: sLoading ? '—' : (stats?.active_employees ?? 0), icon: <People sx={{ fontSize: 20 }} />, color: '#6366f1' },
          { title: 'Total Employees', value: sLoading ? '—' : (stats?.total_employees ?? 0), icon: <People sx={{ fontSize: 20 }} />, color: '#3b82f6' },
          { title: 'Monthly Payroll', value: sLoading ? '—' : `₹${Number(stats?.monthly_payroll || 0).toLocaleString('en-IN')}`, icon: <AttachMoney sx={{ fontSize: 20 }} />, color: '#10b981' },
          { title: 'Pending Salaries', value: sLoading ? '—' : (stats?.pending_salaries ?? 0), icon: <HourglassEmpty sx={{ fontSize: 20 }} />, color: '#f59e0b' },
        ].map(s => (
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

        {/* Employees Tab */}
        {tab === 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            {eLoading ? (
              <Box p={3}>{[1,2,3].map(i => <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />)}</Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    {['Code', 'Name', 'Department', 'Designation', 'Salary', 'Join Date', 'Status'].map(h => (
                      <TableCell key={h}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                        <Box>
                          <People sx={{ fontSize: 40, color: '#e2e8f0', mb: 1 }} />
                          <Typography variant="body2">No employees yet.</Typography>
                          <Button size="small" sx={{ mt: 1 }} onClick={() => setAddEmp(true)}>Add First Employee</Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : employees.map(e => (
                    <TableRow key={e.id} hover>
                      <TableCell>
                        <Chip label={e.employee_code} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9' }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{e.first_name} {e.last_name}</TableCell>
                      <TableCell>{e.department || '—'}</TableCell>
                      <TableCell>{e.designation || '—'}</TableCell>
                      <TableCell>₹{Number(e.salary || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        {e.join_date ? new Date(e.join_date).toLocaleDateString('en-IN') : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={e.status === 'active' ? 'Active' : 'Inactive'}
                          size="small"
                          color={e.status === 'active' ? 'success' : 'default'}
                          icon={e.status === 'active' ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : undefined}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

        {/* Salary Records Tab */}
        {tab === 1 && (
          <Box>
            <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              <TextField
                select label="Select Employee" value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                size="small" sx={{ minWidth: 240 }}
              >
                <MenuItem value="">— Select to view records —</MenuItem>
                {employees.map(e => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.first_name} {e.last_name} ({e.employee_code})
                  </MenuItem>
                ))}
              </TextField>
              <Button size="small" variant="contained" startIcon={<Add />} onClick={() => setAddSal(true)}>
                Record Payment
              </Button>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {['Month/Year', 'Basic Salary', 'Deductions', 'Net Pay', 'Payment Date', 'Status'].map(h => (
                      <TableCell key={h}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!selectedEmpId ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                        Select an employee above to view their salary records.
                      </TableCell>
                    </TableRow>
                  ) : salLoading ? (
                    <TableRow>
                      <TableCell colSpan={6}><Skeleton height={40} /></TableCell>
                    </TableRow>
                  ) : salaryRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                        No salary records for this employee.
                      </TableCell>
                    </TableRow>
                  ) : salaryRecords.map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{MONTHS[s.month - 1]} {s.year}</TableCell>
                      <TableCell>₹{Number(s.basic_salary).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ color: '#ef4444' }}>₹{Number(s.deductions || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#10b981' }}>₹{Number(s.net_salary).toLocaleString('en-IN')}</TableCell>
                      <TableCell>{s.payment_date ? new Date(s.payment_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={s.status === 'paid' ? 'Paid' : 'Pending'}
                          size="small"
                          color={s.status === 'paid' ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}
      </Paper>

      <AddEmployeeDialog open={addEmp} onClose={() => setAddEmp(false)} />
      <AddSalaryDialog open={addSal} onClose={() => setAddSal(false)} employees={employees} />
    </Box>
  );
}
