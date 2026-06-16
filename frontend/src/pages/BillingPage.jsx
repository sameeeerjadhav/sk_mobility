import { useState } from 'react';
import {
  Box, Typography, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, ToggleButton, ToggleButtonGroup, Grid, TextField, Alert,
} from '@mui/material';
import { Download, Visibility, Print, Add } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import InvoicePreview from '../components/InvoicePreview';
import { billingAPI } from '../services';

const printInvoice = (containerId) => {
  const content = document.getElementById(containerId);
  if (!content) return;
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #fff; }
        @page { size: A4; margin: 0; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style>
    </head>
    <body>${content.outerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
};

export default function BillingPage() {
  const [previewId, setPreviewId] = useState(null);
  const [billTypeFilter, setBillTypeFilter] = useState('all');
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const [wForm, setWForm] = useState({ customerName: '', customerPhone: '', customerAddress: '', customerCity: '', customerState: 'Maharashtra', stateCode: 'MH', customerAadhaar: '', customerPan: '', vehicleModel: '', chassisNo: '', motorNo: '', registrationNo: '', odometerReading: '', vehicleSaleDate: '', warrantyStart: '', warrantyEnd: '', warrantyPeriod: '24 Months', totalAmount: '', taxRate: 18, notes: '' });
  const [wError, setWError] = useState('');
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: () => billingAPI.list().then((r) => r.data.data),
  });

  const warrantyMut = useMutation({
    mutationFn: (data) => billingAPI.createWarranty(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); setWarrantyOpen(false); setWError(''); setWForm({ customerName: '', customerPhone: '', customerAddress: '', customerCity: '', customerState: 'Maharashtra', stateCode: 'MH', customerAadhaar: '', customerPan: '', vehicleModel: '', chassisNo: '', motorNo: '', registrationNo: '', odometerReading: '', vehicleSaleDate: '', warrantyStart: '', warrantyEnd: '', warrantyPeriod: '24 Months', totalAmount: '', taxRate: 18, notes: '' }); },
    onError: (err) => setWError(err?.response?.data?.message || 'Failed to create warranty certificate'),
  });

  const handleWarrantySubmit = (e) => {
    e.preventDefault();
    if (!wForm.customerName || !wForm.customerPhone) { setWError('Customer name and phone required'); return; }
    if (!wForm.totalAmount || Number(wForm.totalAmount) <= 0) { setWError('Enter a valid total amount'); return; }
    const taxAmt = Number(wForm.totalAmount) * (Number(wForm.taxRate) / 100);
    warrantyMut.mutate({ ...wForm, totalAmount: Number(wForm.totalAmount), taxAmount: parseFloat(taxAmt.toFixed(2)) });
  };

  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['bill-detail', previewId],
    queryFn: () => billingAPI.get(previewId).then((r) => r.data.data),
    enabled: Boolean(previewId),
  });

  const handleDownload = async (id, billNumber) => {
    const response = await billingAPI.pdf(id);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${billNumber}.pdf`;
    link.click();
  };

  const partyName = (row) => {
    if (row.order_type === 'customer') return row.customer_name || '—';
    return row.dealer_name || '—';
  };

  const filteredData = (data || []).filter(b => {
    if (billTypeFilter === 'all') return true;
    return (b.bill_type || 'vehicle') === billTypeFilter;
  });

  const printId = previewData?.bill?.bill_type === 'warranty'
    ? 'warranty-invoice-print'
    : 'vehicle-invoice-print';

  const columns = [
    { field: 'bill_number', headerName: 'Invoice #', width: 180 },
    { field: 'order_number', headerName: 'Order #', width: 140 },
    {
      field: 'bill_type', headerName: 'Type', width: 110,
      renderCell: (p) => (
        <Chip
          label={p.value === 'warranty' ? 'Warranty' : 'Vehicle'}
          size="small"
          color={p.value === 'warranty' ? 'secondary' : 'primary'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'party', headerName: 'Bill To', flex: 1,
      valueGetter: (_, row) => partyName(row),
    },
    { field: 'subtotal', headerName: 'Taxable', width: 110, valueFormatter: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}` },
    { field: 'tax_amount', headerName: 'GST', width: 100, valueFormatter: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}` },
    { field: 'total_amount', headerName: 'Total', width: 120, valueFormatter: (v) => `₹${Number(v || 0).toLocaleString('en-IN')}` },
    {
      field: 'status', headerName: 'Status', width: 90,
      renderCell: (p) => <Chip label={p.value} size="small" color={p.value === 'issued' ? 'success' : 'default'} />,
    },
    {
      field: 'issued_at', headerName: 'Date', width: 110,
      valueFormatter: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—',
    },
    {
      field: 'actions', headerName: 'Actions', width: 200,
      renderCell: (p) => (
        <Box display="flex" gap={0.5}>
          <Button size="small" startIcon={<Visibility />} onClick={() => setPreviewId(p.row.id)}>View</Button>
          <Button size="small" startIcon={<Download />} onClick={() => handleDownload(p.row.id, p.row.bill_number)}>PDF</Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Billing & Invoicing</Typography>
          <Typography color="text.secondary" mt={0.5}>
            GST tax invoices auto-generated on order creation.
          </Typography>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <Button variant="outlined" startIcon={<Add />} onClick={() => setWarrantyOpen(true)}>
            Create Warranty Certificate
          </Button>
          <ToggleButtonGroup value={billTypeFilter} exclusive onChange={(_, v) => v && setBillTypeFilter(v)} size="small">
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="vehicle">Vehicle Invoice</ToggleButton>
            <ToggleButton value="warranty">Warranty</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box mb={3} />
      <DataTable rows={filteredData.map((b) => ({ id: b.id, ...b }))} columns={columns} loading={isLoading} />

      <Dialog open={Boolean(previewId)} onClose={() => setPreviewId(null)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            {previewData?.bill?.bill_type === 'warranty' ? 'Extended Warranty Certificate' : 'Vehicle Tax Invoice'}
            {previewData?.bill?.bill_number && (
              <Typography variant="caption" color="text.secondary" display="block">
                #{previewData.bill.bill_number}
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={1}>
            {previewData?.bill && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={() => printInvoice(printId)}
                >
                  Print
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Download />}
                  onClick={() => handleDownload(previewData.bill.id, previewData.bill.bill_number)}
                >
                  Download PDF
                </Button>
              </>
            )}
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: '#f5f5f5', p: 2 }}>
          {previewLoading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : (
            <Box sx={{ transform: 'scale(0.75)', transformOrigin: 'top center', width: '133%', ml: '-16%' }}>
              <InvoicePreview data={previewData} />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPreviewId(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Warranty Certificate Creation Dialog */}
      <Dialog open={warrantyOpen} onClose={() => setWarrantyOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <form onSubmit={handleWarrantySubmit}>
          <DialogTitle fontWeight={700}>Create Extended Warranty Certificate</DialogTitle>
          <DialogContent dividers>
            {wError && <Alert severity="error" sx={{ mb: 2 }}>{wError}</Alert>}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}><Typography variant="subtitle2" color="primary">Customer Details</Typography></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth required label="Customer Name" value={wForm.customerName} onChange={e => setWForm({ ...wForm, customerName: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth required label="Phone" value={wForm.customerPhone} onChange={e => setWForm({ ...wForm, customerPhone: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Aadhaar" value={wForm.customerAadhaar} onChange={e => setWForm({ ...wForm, customerAadhaar: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="PAN" value={wForm.customerPan} onChange={e => setWForm({ ...wForm, customerPan: e.target.value.toUpperCase() })} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Address" value={wForm.customerAddress} onChange={e => setWForm({ ...wForm, customerAddress: e.target.value })} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="City" value={wForm.customerCity} onChange={e => setWForm({ ...wForm, customerCity: e.target.value })} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="State" value={wForm.customerState} onChange={e => setWForm({ ...wForm, customerState: e.target.value })} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="State Code" value={wForm.stateCode} onChange={e => setWForm({ ...wForm, stateCode: e.target.value })} /></Grid>

              <Grid item xs={12}><Typography variant="subtitle2" color="primary">Vehicle Details</Typography></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Vehicle Model" value={wForm.vehicleModel} onChange={e => setWForm({ ...wForm, vehicleModel: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Registration No." value={wForm.registrationNo} onChange={e => setWForm({ ...wForm, registrationNo: e.target.value.toUpperCase() })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Chassis No." value={wForm.chassisNo} onChange={e => setWForm({ ...wForm, chassisNo: e.target.value.toUpperCase() })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Engine / Motor No." value={wForm.motorNo} onChange={e => setWForm({ ...wForm, motorNo: e.target.value.toUpperCase() })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Odometer Reading" value={wForm.odometerReading} onChange={e => setWForm({ ...wForm, odometerReading: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Date of Vehicle Sale" InputLabelProps={{ shrink: true }} value={wForm.vehicleSaleDate} onChange={e => setWForm({ ...wForm, vehicleSaleDate: e.target.value })} /></Grid>

              <Grid item xs={12}><Typography variant="subtitle2" color="primary">Warranty Details</Typography></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth type="date" label="Warranty Start" InputLabelProps={{ shrink: true }} value={wForm.warrantyStart} onChange={e => setWForm({ ...wForm, warrantyStart: e.target.value })} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth type="date" label="Warranty End" InputLabelProps={{ shrink: true }} value={wForm.warrantyEnd} onChange={e => setWForm({ ...wForm, warrantyEnd: e.target.value })} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Period of Cover" value={wForm.warrantyPeriod} onChange={e => setWForm({ ...wForm, warrantyPeriod: e.target.value })} placeholder="e.g. 24 Months" /></Grid>

              <Grid item xs={12}><Typography variant="subtitle2" color="primary">Billing</Typography></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth required type="number" label="Total Amount (incl. GST) ₹" value={wForm.totalAmount} onChange={e => setWForm({ ...wForm, totalAmount: e.target.value })} inputProps={{ min: 0 }} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="GST Rate %" value={wForm.taxRate} onChange={e => setWForm({ ...wForm, taxRate: e.target.value })} inputProps={{ min: 0, max: 28 }} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Notes" value={wForm.notes} onChange={e => setWForm({ ...wForm, notes: e.target.value })} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setWarrantyOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={warrantyMut.isPending}>
              {warrantyMut.isPending ? 'Creating...' : 'Create Warranty Certificate'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
