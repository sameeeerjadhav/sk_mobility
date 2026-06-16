import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Paper, IconButton, Tooltip, Alert, Skeleton,
  InputAdornment, DialogContentText, Tabs, Tab,
} from '@mui/material';
import { Add, Delete, Edit, Receipt, CalendarMonth, Category, Tune } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesAPI } from '../services';
import StatCard from '../components/StatCard';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const EMPTY_FORM = () => ({
  category_id: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  description: '',
  paid_by: '',
});

// ── Category Dialog (Add / Edit) ─────────────────────────────────────────────
function CategoryDialog({ open, onClose, editItem }) {
  const qc = useQueryClient();
  const isEdit = !!editItem;
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(isEdit ? editItem.name : '');
      setDesc(isEdit ? editItem.description || '' : '');
      setError('');
      mut.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editItem]);

  const mut = useMutation({
    mutationFn: (data) => isEdit ? expensesAPI.updateCategory(editItem.id, data) : expensesAPI.createCategory(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); onClose(); },
  });

  const handleSubmit = () => {
    if (!name.trim()) { setError('Category name is required'); return; }
    mut.mutate({ name: name.trim(), description: desc.trim() || null });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>{isEdit ? 'Edit Category' : 'Add Category'}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <TextField fullWidth label="Category Name" value={name} onChange={(e) => { setName(e.target.value); setError(''); }}
          required error={!!error} helperText={error} sx={{ mb: 2, mt: 1 }} placeholder="e.g. Rent, Utilities, Salary" />
        <TextField fullWidth label="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} multiline rows={2} />
        {mut.isError && <Alert severity="error" sx={{ mt: 2 }}>{mut.error?.response?.data?.message || 'Failed'}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={mut.isPending}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={mut.isPending} sx={{ minWidth: 120 }}>
          {mut.isPending ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Category')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Add / Edit Expense Dialog ────────────────────────────────────────────────

function ExpenseDialog({ open, onClose, categories, editItem }) {
  const qc = useQueryClient();
  const isEdit = !!editItem;

  const [form, setForm] = useState(EMPTY_FORM());
  const [errors, setErrors] = useState({});

  // Populate form when editing, reset when adding
  useEffect(() => {
    if (open) {
      if (isEdit) {
        setForm({
          category_id: editItem.category_id || '',
          amount: editItem.amount || '',
          date: editItem.date ? editItem.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
          description: editItem.description || '',
          paid_by: editItem.paid_by || '',
        });
      } else {
        setForm(EMPTY_FORM());
      }
      setErrors({});
      mut.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editItem]);

  const mut = useMutation({
    mutationFn: (data) =>
      isEdit
        ? expensesAPI.update(editItem.id, data)
        : expensesAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      setForm(EMPTY_FORM());
      setErrors({});
      onClose();
    },
  });

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.category_id) errs.category_id = 'Select a category';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Enter a valid amount';
    if (!form.date) errs.date = 'Select a date';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    mut.mutate({ ...form, amount: Number(form.amount) });
  };

  const handleClose = () => {
    setForm(EMPTY_FORM());
    setErrors({});
    mut.reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700}>{isEdit ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={12}>
            <TextField
              fullWidth select label="Category" value={form.category_id}
              onChange={set('category_id')} required
              error={!!errors.category_id} helperText={errors.category_id}
            >
              {(categories || []).length === 0
                ? <MenuItem disabled>No categories</MenuItem>
                : (categories || []).map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)
              }
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="Amount" type="number" value={form.amount}
              onChange={set('amount')} required
              error={!!errors.amount} helperText={errors.amount}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="Date" type="date" value={form.date}
              onChange={set('date')} InputLabelProps={{ shrink: true }}
              error={!!errors.date} helperText={errors.date}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="Description" value={form.description}
              onChange={set('description')} multiline rows={2}
              placeholder="What was this expense for?"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="Paid By" value={form.paid_by}
              onChange={set('paid_by')}
              placeholder="e.g. Cash, SBI Account, Petty Cash"
            />
          </Grid>
        </Grid>

        {mut.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {mut.error?.response?.data?.message || mut.error?.message || 'Failed. Please try again.'}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={mut.isPending}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={mut.isPending} sx={{ minWidth: 130 }}>
          {mut.isPending ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Expense')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({ open, onClose, onConfirm, expense, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle fontWeight={700} color="error.main">Delete Expense?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this expense?
          {expense && (
            <Box mt={1.5} sx={{ bgcolor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', p: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>
                ₹{Number(expense.amount).toLocaleString('en-IN')} — {expense.category_name}
              </Typography>
              <Typography variant="caption" color="#64748b">
                {expense.date ? new Date(expense.date).toLocaleDateString('en-IN') : ''} · {expense.description || 'No description'}
              </Typography>
            </Box>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading} sx={{ minWidth: 100 }}>
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const now = new Date();
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [catDialog, setCatDialog] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [deleteCat, setDeleteCat] = useState(null);
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['expenses', 'stats'],
    queryFn: () => expensesAPI.stats().then(r => r.data.data),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['expenses', 'categories'],
    queryFn: () => expensesAPI.categories().then(r => r.data.data),
  });
  const { data: expData, isLoading } = useQuery({
    queryKey: ['expenses', 'list', filterMonth, filterYear],
    queryFn: () => expensesAPI.list({ month: filterMonth, year: filterYear }).then(r => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => expensesAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setDeleteTarget(null); },
  });
  const deleteCatMut = useMutation({
    mutationFn: (id) => expensesAPI.deleteCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setDeleteCat(null); },
  });

  const expenses = expData?.data || [];

  // Category breakdown chips
  const byCat = expenses.reduce((acc, e) => {
    acc[e.category_name] = (acc[e.category_name] || 0) + parseFloat(e.amount);
    return acc;
  }, {});

  const totalThisView = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  const openAdd = () => { setEditItem(null); setDialogOpen(true); };
  const openEdit = (exp) => { setEditItem(exp); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditItem(null); };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0f172a">Office Expenses</Typography>
          <Typography variant="body2" color="#64748b">Track all office and operational expenses</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Tune />} onClick={() => setTab(1)}>Manage Categories</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Expense</Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} mb={3}>
        {[
          { title: 'This Month', value: `₹${Number(stats?.this_month || 0).toLocaleString('en-IN')}`, icon: <CalendarMonth sx={{ fontSize: 20 }} />, color: '#6366f1' },
          { title: 'This Year', value: `₹${Number(stats?.this_year || 0).toLocaleString('en-IN')}`, icon: <Receipt sx={{ fontSize: 20 }} />, color: '#3b82f6' },
          { title: 'Total All Time', value: `₹${Number(stats?.total_all_time || 0).toLocaleString('en-IN')}`, icon: <Receipt sx={{ fontSize: 20 }} />, color: '#8b5cf6' },
          { title: 'Entries This Month', value: stats?.entries_this_month || 0, icon: <Category sx={{ fontSize: 20 }} />, color: '#f59e0b' },
        ].map(s => (
          <Grid item xs={12} sm={6} md={3} key={s.title}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Expenses" icon={<Receipt />} iconPosition="start" />
        <Tab label="Manage Categories" icon={<Category />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <>
      {/* Category breakdown */}
      {Object.keys(byCat).length > 0 && (
        <Box mb={2.5} display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ mr: 0.5 }}>Breakdown:</Typography>
          {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <Chip key={cat} label={`${cat}  ₹${Number(amt).toLocaleString('en-IN')}`}
              size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '12px' }} />
          ))}
        </Box>
      )}

      {/* Filters */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <TextField select label="Month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} size="small" sx={{ minWidth: 120 }}>
          {MONTH_NAMES.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
        </TextField>
        <TextField select label="Year" value={filterYear} onChange={e => setFilterYear(e.target.value)} size="small" sx={{ minWidth: 100 }}>
          {[2024, 2025, 2026, 2027].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </TextField>
        {expenses.length > 0 && (
          <Typography variant="body2" color="#64748b" sx={{ ml: 'auto', fontWeight: 600 }}>
            {expenses.length} entries · Total: <span style={{ color: '#ef4444', fontWeight: 700 }}>₹{totalThisView.toLocaleString('en-IN')}</span>
          </Typography>
        )}
      </Box>

      {/* Table */}
      <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        {isLoading ? (
          <Box p={3}>{[1, 2, 3, 4].map(i => <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />)}</Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                {['Date', 'Category', 'Description', 'Paid By', 'Amount', 'Actions'].map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    <Box>
                      <Receipt sx={{ fontSize: 40, color: '#e2e8f0', mb: 1 }} />
                      <Typography variant="body2">No expenses for {MONTH_NAMES[filterMonth - 1]} {filterYear}.</Typography>
                      <Button size="small" sx={{ mt: 1 }} onClick={openAdd}>Add First Expense</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : expenses.map(exp => (
                <TableRow key={exp.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {exp.date ? new Date(exp.date).toLocaleDateString('en-IN') : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip label={exp.category_name || 'Uncategorized'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exp.description || '—'}
                  </TableCell>
                  <TableCell>{exp.paid_by || '—'}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#ef4444', whiteSpace: 'nowrap' }}>
                    ₹{Number(exp.amount).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(exp)} sx={{ color: '#6366f1', '&:hover': { bgcolor: '#eef2ff' } }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => setDeleteTarget(exp)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {/* Total row */}
              {expenses.length > 0 && (
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  <TableCell colSpan={4} sx={{ fontWeight: 700, color: '#374151' }}>
                    Total ({expenses.length} entries)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#ef4444', fontSize: '15px' }}>
                    ₹{totalThisView.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>
      </>
      )}

      {/* Tab 1: Category Management */}
      {tab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography fontWeight={700}>Expense Categories ({categories.length})</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setEditCat(null); setCatDialog(true); }}>
              Add Category
            </Button>
          </Box>
          <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Category Name', 'Description', 'Actions'].map(h => <TableCell key={h}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                      <Category sx={{ fontSize: 40, color: '#e2e8f0', mb: 1 }} />
                      <Typography variant="body2">No categories yet. Add one to get started.</Typography>
                    </TableCell>
                  </TableRow>
                ) : categories.map(cat => (
                  <TableRow key={cat.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{cat.description || '—'}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditCat(cat); setCatDialog(true); }} sx={{ color: '#6366f1' }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteCat(cat)} sx={{ color: '#ef4444' }}><Delete fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}

      {/* Expense Add/Edit Dialog */}
      <ExpenseDialog
        open={dialogOpen}
        onClose={closeDialog}
        categories={categories}
        editItem={editItem}
      />

      {/* Category Add/Edit Dialog */}
      <CategoryDialog
        open={catDialog}
        onClose={() => { setCatDialog(false); setEditCat(null); }}
        editItem={editCat}
      />

      {/* Delete Expense Confirm */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget.id)}
        expense={deleteTarget}
        loading={deleteMut.isPending}
      />

      {/* Delete Category Confirm */}
      <Dialog open={!!deleteCat} onClose={() => setDeleteCat(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle fontWeight={700} color="error.main">Delete Category?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete category <strong>&quot;{deleteCat?.name}&quot;</strong>? Expenses using this category will become uncategorized.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteCat(null)} variant="outlined" disabled={deleteCatMut.isPending}>Cancel</Button>
          <Button onClick={() => deleteCatMut.mutate(deleteCat.id)} color="error" variant="contained" disabled={deleteCatMut.isPending}>
            {deleteCatMut.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
