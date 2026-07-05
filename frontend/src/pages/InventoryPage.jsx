import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton, Tooltip, Alert, CircularProgress,
  Tabs, Tab, Paper, InputAdornment,
} from '@mui/material';
import {
  Warehouse, Inventory2, Warning, Add, Refresh, SwapHoriz, TrendingUp,
  Search, Close, CheckCircle,
} from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryAPI } from '../services';

const TEAL = '#0d9488';
const TEAL_LIGHT = 'rgba(13,148,136,0.08)';

function StatCard({ icon, label, value, color = TEAL, sub }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ color, display: 'flex' }}>{icon}</Box>
          </Box>
        </Box>
        <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</Typography>
        <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.5 }}>{label}</Typography>
        {sub && <Typography sx={{ fontSize: 11, color: color, mt: 0.5, fontWeight: 600 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function InventoryPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: invData, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryAPI.list().then((r) => r.data),
  });
  const { data: whData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryAPI.warehouses().then((r) => r.data.data || []),
  });

  const rows = invData?.data || [];
  const warehouses = whData || [];

  const stats = useMemo(() => ({
    total: rows.length,
    lowStock: rows.filter((r) => r.is_low_stock).length,
    wh: warehouses.length,
    inStock: rows.filter((r) => !r.is_low_stock).length,
  }), [rows, warehouses]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter((r) =>
      r.vehicle_name?.toLowerCase().includes(s) ||
      r.variant_name?.toLowerCase().includes(s) ||
      r.warehouse_name?.toLowerCase().includes(s) ||
      r.sku?.toLowerCase().includes(s)
    );
  }, [rows, search]);

  const adjustMut = useMutation({
    mutationFn: (data) => inventoryAPI.adjust(data),
    onSuccess: () => { qc.invalidateQueries(['inventory']); setAdjustOpen(false); setForm({}); setSuccess('Stock adjusted successfully'); setTimeout(() => setSuccess(''), 3000); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to adjust stock'),
  });

  const transferMut = useMutation({
    mutationFn: (data) => inventoryAPI.transfer(data),
    onSuccess: () => { qc.invalidateQueries(['inventory']); setTransferOpen(false); setForm({}); setSuccess('Stock transferred successfully'); setTimeout(() => setSuccess(''), 3000); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to transfer stock'),
  });

  const openAdjust = () => { setForm({ adjustment_type: 'add' }); setError(''); setAdjustOpen(true); };
  const openTransfer = () => { setForm({}); setError(''); setTransferOpen(true); };

  const handleAdjust = () => {
    if (!form.inventory_id || !form.quantity || !form.adjustment_type) return setError('All fields are required');
    adjustMut.mutate({ inventory_id: form.inventory_id, quantity: Number(form.quantity), adjustment_type: form.adjustment_type, notes: form.notes });
  };

  const handleTransfer = () => {
    if (!form.inventory_id || !form.to_warehouse_id || !form.quantity) return setError('All fields are required');
    transferMut.mutate({ inventory_id: form.inventory_id, to_warehouse_id: form.to_warehouse_id, quantity: Number(form.quantity), notes: form.notes });
  };

  const selectedInv = rows.find((r) => r.id === form.inventory_id);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Inventory Management</Typography>
          <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.25 }}>Monitor stock levels across all warehouses</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<SwapHoriz />} onClick={openTransfer}
            sx={{ borderColor: TEAL, color: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}>
            Transfer Stock
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openAdjust}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            Adjust Stock
          </Button>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}><StatCard icon={<Inventory2 />} label="Total Items" value={stats.total} /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="In Stock" value={stats.inStock} color="#16a34a" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Warning />} label="Low Stock" value={stats.lowStock} color="#ef4444" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Warehouse />} label="Warehouses" value={stats.wh} color="#0ea5e9" /></Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small" placeholder="Search vehicle, variant, warehouse, SKU..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }}
            sx={{ flex: 1, maxWidth: 400 }}
          />
          <Tooltip title="Refresh"><IconButton size="small" onClick={() => qc.invalidateQueries(['inventory'])}><Refresh fontSize="small" /></IconButton></Tooltip>
          {stats.lowStock > 0 && <Chip label={`${stats.lowStock} Low Stock`} color="error" size="small" />}
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Warehouse', 'Vehicle', 'Variant', 'SKU', 'Quantity', 'Threshold', 'Status'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.06em' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={28} sx={{ color: TEAL }} /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94a3b8' }}>No inventory records found</TableCell></TableRow>
              ) : filtered.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{row.warehouse_name}</TableCell>
                  <TableCell>{row.vehicle_name}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{row.variant_name}</TableCell>
                  <TableCell><Chip label={row.sku} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', fontSize: 11 }} /></TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 15 }}>{row.quantity}</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>{row.low_stock_threshold}</TableCell>
                  <TableCell>
                    {row.is_low_stock
                      ? <Chip label="Low Stock" size="small" color="error" />
                      : <Chip label="In Stock" size="small" color="success" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Adjust Stock
          <IconButton size="small" onClick={() => setAdjustOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <TextField select label="Inventory Item *" value={form.inventory_id || ''} onChange={(e) => setForm({ ...form, inventory_id: e.target.value })} size="small">
            {rows.map((r) => <MenuItem key={r.id} value={r.id}>{r.warehouse_name} — {r.vehicle_name} {r.variant_name} (qty: {r.quantity})</MenuItem>)}
          </TextField>
          <TextField select label="Adjustment Type *" value={form.adjustment_type || 'add'} onChange={(e) => setForm({ ...form, adjustment_type: e.target.value })} size="small">
            <MenuItem value="add">Add Stock</MenuItem>
            <MenuItem value="remove">Remove Stock</MenuItem>
            <MenuItem value="set">Set Exact Quantity</MenuItem>
          </TextField>
          <TextField label="Quantity *" type="number" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: e.target.value })} size="small" inputProps={{ min: 1 }} />
          <TextField label="Notes (optional)" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} size="small" multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdjust} disabled={adjustMut.isPending}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            {adjustMut.isPending ? 'Adjusting...' : 'Adjust Stock'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Stock Dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Transfer Stock
          <IconButton size="small" onClick={() => setTransferOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <TextField select label="Item to Transfer *" value={form.inventory_id || ''} onChange={(e) => setForm({ ...form, inventory_id: e.target.value })} size="small">
            {rows.map((r) => <MenuItem key={r.id} value={r.id}>{r.warehouse_name} — {r.vehicle_name} {r.variant_name} (qty: {r.quantity})</MenuItem>)}
          </TextField>
          {selectedInv && (
            <Alert severity="info">From: <strong>{selectedInv.warehouse_name}</strong> — Available: <strong>{selectedInv.quantity}</strong></Alert>
          )}
          <TextField select label="To Warehouse *" value={form.to_warehouse_id || ''} onChange={(e) => setForm({ ...form, to_warehouse_id: e.target.value })} size="small">
            {warehouses.filter((w) => w.id !== selectedInv?.warehouse_id).map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
          </TextField>
          <TextField label="Quantity *" type="number" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: e.target.value })} size="small" inputProps={{ min: 1, max: selectedInv?.quantity }} />
          <TextField label="Notes (optional)" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} size="small" multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setTransferOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTransfer} disabled={transferMut.isPending}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}>
            {transferMut.isPending ? 'Transferring...' : 'Transfer Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
