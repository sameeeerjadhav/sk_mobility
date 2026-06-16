import { useState } from 'react';
import {
  Box, Typography, Chip, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, Grid, IconButton,
} from '@mui/material';
import { Add, Delete, CheckCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import { ordersAPI, dealersAPI, billingAPI } from '../services';
import { useAuth, isSuperAdmin } from '../hooks/useAuth';

const statusColors = {
  pending: 'warning', approved: 'info', processing: 'primary',
  shipped: 'secondary', delivered: 'success', cancelled: 'error',
};

const emptyItem = { variantId: '', quantity: 1 };

export default function OrdersPage() {
  const { user } = useAuth();
  const isAdmin = isSuperAdmin(user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [billSuccess, setBillSuccess] = useState(null);
  const [error, setError] = useState('');

  const orderType = tab === 0 ? 'dealer' : 'customer';

  const [dealerForm, setDealerForm] = useState({
    dealerId: '', deliveryAddress: '', notes: '', expectedDeliveryDate: '', items: [{ ...emptyItem }],
  });
  const [customerForm, setCustomerForm] = useState({
    customerName: '', customerPhone: '', customerEmail: '', customerAddress: '',
    customerAadhaar: '', customerPan: '',
    chassisNo: '', motorNo: '', batteryCapacity: '', color: '',
    pmDriveIncentive: '', stateSubsidy: '',
    deliveryAddress: '', notes: '', expectedDeliveryDate: '', items: [{ ...emptyItem }],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', orderType],
    queryFn: () => ordersAPI.list({ orderType }).then((r) => r.data),
  });

  const { data: variants = [] } = useQuery({
    queryKey: ['order-variants'],
    queryFn: () => ordersAPI.variants().then((r) => r.data.data),
    enabled: dialogOpen,
  });

  const { data: dealersData } = useQuery({
    queryKey: ['dealers-list'],
    queryFn: () => dealersAPI.list({ status: 'approved' }).then((r) => r.data),
    enabled: dialogOpen && orderType === 'dealer' && isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => ordersAPI.create(payload),
    onSuccess: (res) => {
      const order = res.data.data;
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['bills']);
      setDialogOpen(false);
      setError('');
      resetForms();
      setBillSuccess({
        orderNumber: order.order_number,
        billNumber: order.bill?.billNumber,
        billId: order.bill?.id,
        totalAmount: order.total_amount,
      });
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to create order'),
  });

  const handleDownloadBill = async (billId, billNumber) => {
    const response = await billingAPI.pdf(billId);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${billNumber}.pdf`;
    link.click();
  };

  const resetForms = () => {
    setDealerForm({ dealerId: '', deliveryAddress: '', notes: '', expectedDeliveryDate: '', items: [{ ...emptyItem }] });
    setCustomerForm({
      customerName: '', customerPhone: '', customerEmail: '', customerAddress: '',
      customerAadhaar: '', customerPan: '',
      chassisNo: '', motorNo: '', batteryCapacity: '', color: '',
      pmDriveIncentive: '', stateSubsidy: '',
      deliveryAddress: '', notes: '', expectedDeliveryDate: '', items: [{ ...emptyItem }],
    });
  };

  const dealerColumns = [
    { field: 'order_number', headerName: 'Order #', width: 160 },
    { field: 'dealer_name', headerName: 'Dealer', flex: 1 },
    { field: 'dealer_code', headerName: 'Code', width: 120 },
    { field: 'total_amount', headerName: 'Amount', width: 130, valueFormatter: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <Chip label={p.value} color={statusColors[p.value]} size="small" /> },
    { field: 'created_at', headerName: 'Date', width: 120, valueFormatter: (v) => new Date(v).toLocaleDateString('en-IN') },
    { field: 'tracking_number', headerName: 'Tracking', width: 140 },
  ];

  const customerColumns = [
    { field: 'order_number', headerName: 'Order #', width: 160 },
    { field: 'customer_name', headerName: 'Customer', flex: 1 },
    { field: 'customer_phone', headerName: 'Phone', width: 130 },
    { field: 'customer_email', headerName: 'Email', flex: 1 },
    { field: 'total_amount', headerName: 'Amount', width: 130, valueFormatter: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <Chip label={p.value} color={statusColors[p.value]} size="small" /> },
    { field: 'created_at', headerName: 'Date', width: 120, valueFormatter: (v) => new Date(v).toLocaleDateString('en-IN') },
    { field: 'tracking_number', headerName: 'Tracking', width: 140 },
  ];

  const updateItem = (form, setForm, index, field, value) => {
    const items = form.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    setForm({ ...form, items });
  };

  const addItemRow = (form, setForm) => setForm({ ...form, items: [...form.items, { ...emptyItem }] });

  const removeItemRow = (form, setForm, index) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const renderItemRows = (form, setForm) => form.items.map((item, index) => (
    <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
      <Grid item xs={12} sm={7}>
        <TextField
          select fullWidth required label="Vehicle Variant" size="small"
          value={item.variantId}
          onChange={(e) => updateItem(form, setForm, index, 'variantId', e.target.value)}
        >
          {variants.map((v) => (
            <MenuItem key={v.id} value={v.id}>
              {v.vehicle_name} — {v.name} (₹{Number(v.price).toLocaleString('en-IN')})
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={8} sm={3}>
        <TextField
          fullWidth required type="number" label="Qty" size="small"
          value={item.quantity}
          onChange={(e) => updateItem(form, setForm, index, 'quantity', Number(e.target.value))}
          inputProps={{ min: 1 }}
        />
      </Grid>
      <Grid item xs={4} sm={2}>
        <IconButton color="error" onClick={() => removeItemRow(form, setForm, index)} disabled={form.items.length === 1}>
          <Delete />
        </IconButton>
      </Grid>
    </Grid>
  ));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const form = orderType === 'dealer' ? dealerForm : customerForm;
    const items = form.items
      .filter((i) => i.variantId)
      .map((i) => ({ variantId: Number(i.variantId), quantity: Number(i.quantity) }));

    if (!items.length) {
      setError('Add at least one vehicle variant');
      return;
    }

    const payload = {
      orderType,
      items,
      deliveryAddress: form.deliveryAddress || undefined,
      notes: form.notes || undefined,
      expectedDeliveryDate: form.expectedDeliveryDate || undefined,
    };

    if (orderType === 'dealer') {
      payload.dealerId = isAdmin ? Number(dealerForm.dealerId) : user?.dealer?.id;
      if (!payload.dealerId) {
        setError(isAdmin ? 'Select a dealer' : 'Dealer profile not linked to your account. Contact admin.');
        return;
      }
    } else {
      payload.customerName = customerForm.customerName.trim();
      payload.customerPhone = customerForm.customerPhone.trim();
      payload.customerEmail = customerForm.customerEmail.trim() || undefined;
      payload.customerAddress = customerForm.customerAddress.trim() || undefined;
      payload.customerAadhaar = customerForm.customerAadhaar.trim() || undefined;
      payload.customerPan = customerForm.customerPan.trim() || undefined;
      payload.chassisNo = customerForm.chassisNo.trim() || undefined;
      payload.motorNo = customerForm.motorNo.trim() || undefined;
      payload.batteryCapacity = customerForm.batteryCapacity.trim() || undefined;
      payload.color = customerForm.color.trim() || undefined;
      payload.pmDriveIncentive = customerForm.pmDriveIncentive ? Number(customerForm.pmDriveIncentive) : 0;
      payload.stateSubsidy = customerForm.stateSubsidy ? Number(customerForm.stateSubsidy) : 0;
      if (!payload.customerName || !payload.customerPhone) {
        setError('Customer name and phone are required');
        return;
      }
    }

    createMutation.mutate(payload);
  };

  const openCreateDialog = () => {
    resetForms();
    if (!isAdmin && user?.dealer?.id) {
      setDealerForm((f) => ({ ...f, dealerId: user.dealer.id }));
    }
    setError('');
    setDialogOpen(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight={700}>Order Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          New {orderType === 'dealer' ? 'Dealer' : 'Customer'} Order
        </Button>
      </Box>

      {isAdmin ? (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Dealer Orders" />
          <Tab label="Direct Customer Orders" />
        </Tabs>
      ) : (
        <Typography variant="subtitle1" color="text.secondary" mb={2}>My Dealer Orders</Typography>
      )}

      <DataTable
        title={orderType === 'dealer' ? 'Dealer Orders' : 'Direct Customer Orders'}
        rows={(data?.data || []).map((o) => ({ id: o.id, ...o }))}
        columns={orderType === 'dealer' ? dealerColumns : customerColumns}
        loading={isLoading}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            Create {orderType === 'dealer' ? 'Dealer' : 'Direct Customer'} Order
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {orderType === 'dealer' ? (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {isAdmin && (
                  <Grid item xs={12}>
                    <TextField
                      select fullWidth required label="Dealer"
                      value={dealerForm.dealerId}
                      onChange={(e) => setDealerForm({ ...dealerForm, dealerId: e.target.value })}
                    >
                      {(dealersData?.data || []).map((d) => (
                        <MenuItem key={d.id} value={d.id}>{d.business_name} ({d.dealer_code})</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Order Items</Typography>
                  {renderItemRows(dealerForm, setDealerForm)}
                  <Button size="small" onClick={() => addItemRow(dealerForm, setDealerForm)}>+ Add Item</Button>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} label="Delivery Address" value={dealerForm.deliveryAddress} onChange={(e) => setDealerForm({ ...dealerForm, deliveryAddress: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="date" label="Expected Delivery" InputLabelProps={{ shrink: true }} value={dealerForm.expectedDeliveryDate} onChange={(e) => setDealerForm({ ...dealerForm, expectedDeliveryDate: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} label="Notes" value={dealerForm.notes} onChange={(e) => setDealerForm({ ...dealerForm, notes: e.target.value })} />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label="Customer Name" value={customerForm.customerName} onChange={(e) => setCustomerForm({ ...customerForm, customerName: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label="Customer Phone" value={customerForm.customerPhone} onChange={(e) => setCustomerForm({ ...customerForm, customerPhone: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Customer Email" type="email" value={customerForm.customerEmail} onChange={(e) => setCustomerForm({ ...customerForm, customerEmail: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Customer Aadhaar" value={customerForm.customerAadhaar} onChange={(e) => setCustomerForm({ ...customerForm, customerAadhaar: e.target.value })} inputProps={{ maxLength: 12 }} placeholder="12-digit Aadhaar" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Customer PAN" value={customerForm.customerPan} onChange={(e) => setCustomerForm({ ...customerForm, customerPan: e.target.value.toUpperCase() })} inputProps={{ maxLength: 10 }} placeholder="e.g. ABCDE1234F" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} label="Customer Address" value={customerForm.customerAddress} onChange={(e) => setCustomerForm({ ...customerForm, customerAddress: e.target.value })} />
                </Grid>

                <Grid item xs={12}><Typography variant="subtitle2" color="primary" gutterBottom>🚗 Vehicle Details (for Invoice)</Typography></Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Chassis No." value={customerForm.chassisNo} onChange={(e) => setCustomerForm({ ...customerForm, chassisNo: e.target.value.toUpperCase() })} placeholder="e.g. MD2C59200TAB72430" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Motor No." value={customerForm.motorNo} onChange={(e) => setCustomerForm({ ...customerForm, motorNo: e.target.value.toUpperCase() })} placeholder="e.g. E20ATB84233" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Battery Capacity" value={customerForm.batteryCapacity} onChange={(e) => setCustomerForm({ ...customerForm, batteryCapacity: e.target.value })} placeholder="e.g. 3.5 KWH" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Color" value={customerForm.color} onChange={(e) => setCustomerForm({ ...customerForm, color: e.target.value })} placeholder="e.g. Brooklyn Black" />
                </Grid>

                <Grid item xs={12}><Typography variant="subtitle2" color="primary" gutterBottom>💰 Subsidies / Incentives</Typography></Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="PM E-DRIVE Incentive (₹)" type="number" value={customerForm.pmDriveIncentive} onChange={(e) => setCustomerForm({ ...customerForm, pmDriveIncentive: e.target.value })} placeholder="e.g. 5000" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="State Govt. Subsidy (₹)" type="number" value={customerForm.stateSubsidy} onChange={(e) => setCustomerForm({ ...customerForm, stateSubsidy: e.target.value })} />
                </Grid>

                <Grid item xs={12}><Typography variant="subtitle2" gutterBottom>Order Items</Typography></Grid>
                <Grid item xs={12}>
                  {renderItemRows(customerForm, setCustomerForm)}
                  <Button size="small" onClick={() => addItemRow(customerForm, setCustomerForm)}>+ Add Item</Button>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} label="Delivery Address" value={customerForm.deliveryAddress} onChange={(e) => setCustomerForm({ ...customerForm, deliveryAddress: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="date" label="Expected Delivery" InputLabelProps={{ shrink: true }} value={customerForm.expectedDeliveryDate} onChange={(e) => setCustomerForm({ ...customerForm, expectedDeliveryDate: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} label="Notes" value={customerForm.notes} onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })} />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Bill created success popup */}
      <Dialog open={Boolean(billSuccess)} onClose={() => setBillSuccess(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <CheckCircle color="success" sx={{ fontSize: 56, mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>Bill Created Successfully</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography color="text.secondary" mb={2}>
            Your order has been placed and a tax invoice has been auto-generated and saved to Billing.
          </Typography>
          <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, textAlign: 'left' }}>
            <Typography variant="body2"><strong>Order:</strong> {billSuccess?.orderNumber}</Typography>
            <Typography variant="body2"><strong>Bill:</strong> {billSuccess?.billNumber}</Typography>
            <Typography variant="body2"><strong>Amount:</strong> ₹{Number(billSuccess?.totalAmount || 0).toLocaleString('en-IN')}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => handleDownloadBill(billSuccess.billId, billSuccess.billNumber)}
          >
            Download Bill PDF
          </Button>
          {isAdmin && (
            <Button fullWidth variant="outlined" onClick={() => { setBillSuccess(null); navigate('/billing'); }}>
              View in Billing
            </Button>
          )}
          <Button fullWidth onClick={() => setBillSuccess(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
