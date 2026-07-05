import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton, Tooltip, Alert, CircularProgress,
  Paper, InputAdornment, Tabs, Tab,
} from '@mui/material';
import {
  Category, Inventory2, Warning, Add, Search, Refresh,
  Close, Edit, Delete, RecordVoiceOver, Build,
} from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sparePartsAPI, inventoryAPI } from '../services';

const TEAL = '#0d9488';
const TEAL_LIGHT = 'rgba(13,148,136,0.08)';

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

export default function SparePartsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [usageForm, setUsageForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: partsData, isLoading: partsLoading } = useQuery({
    queryKey: ['spare-parts'],
    queryFn: () => sparePartsAPI.list().then((r) => r.data),
  });
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['spare-stock'],
    queryFn: () => sparePartsAPI.stock().then((r) => r.data.data || []),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['spare-categories'],
    queryFn: () => sparePartsAPI.categories().then((r) => r.data.data || []),
  });
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryAPI.warehouses().then((r) => r.data.data || []),
  });

  const parts = partsData?.data || [];
  const stock = stockData || [];

  const stats = useMemo(() => ({
    total: parts.length,
    categories: categories.length,
    lowStock: stock.filter((s) => s.is_low_stock).length,
    totalStock: stock.reduce((sum, s) => sum + (s.quantity || 0), 0),
  }), [parts, categories, stock]);

  const filteredParts = useMemo(() => {
    if (!search) return parts;
    const s = search.toLowerCase();
    return parts.filter((p) => p.name?.toLowerCase().includes(s) || p.part_number?.toLowerCase().includes(s) || p.category_name?.toLowerCase().includes(s));
  }, [parts, search]);

  const filteredStock = useMemo(() => {
    if (!search) return stock;
    const s = search.toLowerCase();
    return stock.filter((r) => r.part_name?.toLowerCase().includes(s) || r.part_number?.toLowerCase().includes(s) || r.warehouse_name?.toLowerCase().includes(s));
  }, [stock, search]);

  const notify = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const createMut = useMutation({
    mutationFn: (data) => sparePartsAPI.create(data),
    onSuccess: () => { qc.invalidateQueries(['spare-parts']); setAddOpen(false); setForm({}); notify('Part added successfully'); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to create part'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => sparePartsAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['spare-parts']); setEditOpen(false); setSelected(null); notify('Part updated'); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to update part'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => sparePartsAPI.remove(id),
    onSuccess: () => { qc.invalidateQueries(['spare-parts']); setDeleteOpen(false); setSelected(null); notify('Part removed'); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to delete part'),
  });

  const usageMut = useMutation({
    mutationFn: (data) => sparePartsAPI.recordUsage(data),
    onSuccess: () => { qc.invalidateQueries(['spare-stock']); setUsageOpen(false); setUsageForm({}); notify('Usage recorded — stock updated'); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to record usage'),
  });

  const openAdd = () => { setForm({}); setError(''); setAddOpen(true); };
  const openEdit = (part) => { setSelected(part); setForm({ name: part.name, part_number: part.part_number, category_id: part.category_id, unit_price: part.unit_price, description: part.description }); setError(''); setEditOpen(true); };
  const openDelete = (part) => { setSelected(part); setDeleteOpen(true); };
  const openUsage = () => { setUsageForm({}); setError(''); setUsageOpen(true); };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Spare Parts Management</Typography>
          <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.25 }}>Manage parts catalog, stock levels, and usage records</Typography>
        </Box>
        <Box display="flex" gap={1}>
          {tab === 1 && (
            <Button variant="outlined" startIcon={<RecordVoiceOver />} onClick={openUsage}
              sx={{ borderColor: TEAL, color: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}>
              Record Usage
            </Button>
          )}
          {tab === 0 && (
            <Button variant="contained" startIcon={<Add />} onClick={openAdd}
              sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
              Add Part
            </Button>
          )}
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}><StatCard icon={<Build />} label="Total Parts" value={stats.total} /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Category />} label="Categories" value={stats.categories} color="#0ea5e9" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Inventory2 />} label="Total Stock" value={stats.totalStock} color="#16a34a" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Warning />} label="Low Stock Items" value={stats.lowStock} color="#ef4444" /></Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: '1px solid #f1f5f9', px: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { fontSize: 13, fontWeight: 600 } }}>
            <Tab label="Parts Catalog" />
            <Tab label={<Box display="flex" alignItems="center" gap={1}>Stock Levels {stats.lowStock > 0 && <Chip label={stats.lowStock} size="small" color="error" sx={{ height: 16, fontSize: 10 }} />}</Box>} />
          </Tabs>
        </Box>

        {/* Toolbar */}
        <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField size="small" placeholder={tab === 0 ? 'Search part name, number, category...' : 'Search part, warehouse...'}
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }}
            sx={{ flex: 1, maxWidth: 400 }}
          />
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => { qc.invalidateQueries(['spare-parts']); qc.invalidateQueries(['spare-stock']); }}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Parts Catalog Tab */}
        {tab === 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Part #', 'Name', 'Category', 'Unit Price', 'Description', 'Actions'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.06em' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {partsLoading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} sx={{ color: TEAL }} /></TableCell></TableRow>
                ) : filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Build sx={{ fontSize: 40, color: '#e2e8f0', display: 'block', mx: 'auto', mb: 1 }} />
                      <Typography color="text.secondary" fontSize={14}>No spare parts in catalog</Typography>
                      <Button size="small" sx={{ mt: 1, color: TEAL }} onClick={openAdd}>Add First Part</Button>
                    </TableCell>
                  </TableRow>
                ) : filteredParts.map((part) => (
                  <TableRow key={part.id} hover>
                    <TableCell><Chip label={part.part_number} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', fontSize: 11 }} /></TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{part.name}</TableCell>
                    <TableCell><Chip label={part.category_name} size="small" color="primary" /></TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>₹{Number(part.unit_price || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: 12, maxWidth: 200 }}>
                      <Typography noWrap fontSize={12}>{part.description || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(part)} sx={{ color: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}>
                            <Edit sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => openDelete(part)} sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}>
                            <Delete sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Stock Levels Tab */}
        {tab === 1 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Part #', 'Part Name', 'Warehouse', 'Quantity', 'Low Stock Threshold', 'Status'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.06em' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {stockLoading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} sx={{ color: TEAL }} /></TableCell></TableRow>
                ) : filteredStock.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8' }}>No stock records found</TableCell></TableRow>
                ) : filteredStock.map((row, i) => (
                  <TableRow key={i} hover sx={{ bgcolor: row.is_low_stock ? 'rgba(239,68,68,0.02)' : 'inherit' }}>
                    <TableCell><Chip label={row.part_number} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', fontSize: 11 }} /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.part_name}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{row.warehouse_name}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 15, color: row.is_low_stock ? '#ef4444' : '#0f172a' }}>{row.quantity}</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{row.low_stock_threshold}</TableCell>
                    <TableCell>
                      {row.is_low_stock
                        ? <Chip label="Low Stock" size="small" color="error" />
                        : <Chip label="OK" size="small" color="success" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add Part Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Add Spare Part
          <IconButton size="small" onClick={() => setAddOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Part Name *" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Part Number *" value={form.part_number || ''} onChange={(e) => setForm({ ...form, part_number: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Category *" value={form.category_id || ''} onChange={(e) => setForm({ ...form, category_id: e.target.value })} size="small">
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Unit Price (₹)" type="number" value={form.unit_price || ''} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} size="small" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={createMut.isPending}
            onClick={() => { if (!form.name || !form.part_number || !form.category_id) return setError('Name, part number, and category are required'); createMut.mutate(form); }}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            {createMut.isPending ? 'Adding...' : 'Add Part'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Part Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Edit Spare Part
          <IconButton size="small" onClick={() => setEditOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Part Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Part Number" value={form.part_number || ''} onChange={(e) => setForm({ ...form, part_number: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Category" value={form.category_id || ''} onChange={(e) => setForm({ ...form, category_id: e.target.value })} size="small">
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Unit Price (₹)" type="number" value={form.unit_price || ''} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} size="small" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={updateMut.isPending}
            onClick={() => updateMut.mutate({ id: selected?.id, data: form })}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            {updateMut.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Part</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove <strong>{selected?.name}</strong> ({selected?.part_number}) from the catalog?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={deleteMut.isPending}
            onClick={() => deleteMut.mutate(selected?.id)}>
            {deleteMut.isPending ? 'Removing...' : 'Remove Part'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Usage Dialog */}
      <Dialog open={usageOpen} onClose={() => setUsageOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Record Parts Usage
          <IconButton size="small" onClick={() => setUsageOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Spare Part *" value={usageForm.sparePartId || ''} onChange={(e) => setUsageForm({ ...usageForm, sparePartId: e.target.value })} size="small">
                {parts.map((p) => <MenuItem key={p.id} value={p.id}>{p.name} — {p.part_number}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Warehouse *" value={usageForm.warehouseId || ''} onChange={(e) => setUsageForm({ ...usageForm, warehouseId: e.target.value })} size="small">
                {warehouses.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Quantity Used *" type="number" value={usageForm.quantity || ''} onChange={(e) => setUsageForm({ ...usageForm, quantity: e.target.value })} size="small" inputProps={{ min: 1 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Unit Cost (₹)" type="number" value={usageForm.unitCost || ''} onChange={(e) => setUsageForm({ ...usageForm, unitCost: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Job Card ID (optional)" value={usageForm.jobCardId || ''} onChange={(e) => setUsageForm({ ...usageForm, jobCardId: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" value={usageForm.notes || ''} onChange={(e) => setUsageForm({ ...usageForm, notes: e.target.value })} size="small" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setUsageOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={usageMut.isPending}
            onClick={() => {
              if (!usageForm.sparePartId || !usageForm.warehouseId || !usageForm.quantity) return setError('Part, warehouse, and quantity are required');
              usageMut.mutate(usageForm);
            }}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            {usageMut.isPending ? 'Recording...' : 'Record Usage'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
