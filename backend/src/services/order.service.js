const db = require('../config/database');
const { AppError, generateOrderNumber, paginate, paginatedResponse } = require('../utils/helpers');
const { createAuditLog } = require('../utils/audit');
const { notifyAdmins, notifyDealer } = require('./notification.service');
const billingService = require('./billing.service');

const list = async (filters = {}, user = null) => {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  let where = 'WHERE 1=1';
  const params = [];

  if (user?.role_slug === 'dealer' && user.dealer) {
    where += ' AND o.dealer_id = ? AND o.order_type = ?';
    params.push(user.dealer.id, 'dealer');
  }
  if (filters.orderType) { where += ' AND o.order_type = ?'; params.push(filters.orderType); }
  if (filters.status) { where += ' AND o.status = ?'; params.push(filters.status); }
  if (filters.dealerId) { where += ' AND o.dealer_id = ?'; params.push(filters.dealerId); }

  const [count] = await db.query(`SELECT COUNT(*) AS total FROM orders o ${where}`, params);
  const [rows] = await db.query(
    `SELECT o.*, d.business_name AS dealer_name, d.dealer_code
     FROM orders o LEFT JOIN dealers d ON o.dealer_id = d.id ${where}
     ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return paginatedResponse(rows, count[0].total, page, limit);
};

const getById = async (id) => {
  const [orders] = await db.query(
    `SELECT o.*, d.business_name AS dealer_name, d.dealer_code
     FROM orders o LEFT JOIN dealers d ON o.dealer_id = d.id WHERE o.id = ?`, [id]
  );
  if (!orders.length) throw new AppError('Order not found', 404);

  const [items] = await db.query(
    `SELECT oi.*, v.name AS vehicle_name, vv.name AS variant_name, vv.sku
     FROM order_items oi JOIN vehicles v ON oi.vehicle_id = v.id
     JOIN vehicle_variants vv ON oi.variant_id = vv.id WHERE oi.order_id = ?`, [id]
  );
  const [history] = await db.query(
    'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at DESC', [id]
  );
  return { ...orders[0], items, statusHistory: history };
};

const listVariants = async () => {
  const [rows] = await db.query(
    `SELECT vv.id, vv.name, vv.sku, vv.price, vv.color, v.name AS vehicle_name
     FROM vehicle_variants vv JOIN vehicles v ON vv.vehicle_id = v.id
     WHERE vv.is_active = 1 AND v.is_active = 1 ORDER BY v.name, vv.name`
  );
  return rows;
};

const create = async (data, userId, req) => {
  const orderType = data.orderType || 'dealer';

  if (orderType === 'dealer' && !data.dealerId) {
    throw new AppError('Dealer is required for dealer orders', 400);
  }
  if (orderType === 'customer') {
    if (!data.customerName || !data.customerPhone) {
      throw new AppError('Customer name and phone are required', 400);
    }
  }
  if (!data.items?.length) throw new AppError('At least one order item is required', 400);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const orderNumber = generateOrderNumber(orderType === 'customer' ? 'CORD' : 'ORD');
    let subtotal = 0;
    const itemRows = [];

    for (const item of data.items) {
      const [variants] = await conn.query('SELECT * FROM vehicle_variants WHERE id = ? AND is_active = 1', [item.variantId]);
      if (!variants.length) throw new AppError(`Variant ${item.variantId} not found`, 400);
      const total = variants[0].price * item.quantity;
      subtotal += total;
      itemRows.push({ ...item, unitPrice: variants[0].price, total, vehicleId: variants[0].vehicle_id });
    }

    const taxAmount = subtotal * (data.taxRate || 0.18);
    const discount = data.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discount;

    const dealerId = orderType === 'dealer' ? data.dealerId : null;

    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_number, order_type, dealer_id, customer_name, customer_phone, customer_email,
       status, subtotal, tax_amount, discount_amount, total_amount, notes, delivery_address,
       expected_delivery_date, created_by,
       chassis_no, motor_no, battery_capacity, color, customer_aadhaar, customer_pan,
       customer_address, pm_drive_incentive, state_subsidy)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber, orderType, dealerId,
        orderType === 'customer' ? data.customerName : null,
        orderType === 'customer' ? data.customerPhone : null,
        orderType === 'customer' ? data.customerEmail : null,
        subtotal, taxAmount, discount, totalAmount,
        data.notes, data.deliveryAddress, data.expectedDeliveryDate, userId,
        data.chassisNo || null, data.motorNo || null, data.batteryCapacity || null,
        data.color || null, data.customerAadhaar || null, data.customerPan || null,
        data.customerAddress || null,
        data.pmDriveIncentive || 0, data.stateSubsidy || 0,
      ]
    );

    for (const item of itemRows) {
      await conn.query(
        'INSERT INTO order_items (order_id, vehicle_id, variant_id, quantity, unit_price, total_price) VALUES (?,?,?,?,?,?)',
        [orderResult.insertId, item.vehicleId, item.variantId, item.quantity, item.unitPrice, item.total]
      );
    }

    await conn.query(
      'INSERT INTO order_status_history (order_id, to_status, notes, changed_by) VALUES (?, ?, ?, ?)',
      [orderResult.insertId, 'pending', `${orderType === 'customer' ? 'Customer' : 'Dealer'} order created`, userId]
    );

    await conn.commit();

    const label = orderType === 'customer' ? 'Customer order' : 'Dealer order';
    await notifyAdmins({ title: 'New Order', message: `${label} ${orderNumber} received`, type: 'new_order', channels: ['in_app'] });
    if (dealerId) {
      await notifyDealer(dealerId, { title: 'New Order', message: `Order ${orderNumber} received`, type: 'new_order', channels: ['in_app'] });
    }
    await createAuditLog({ userId, action: 'create', module: 'orders', entityType: 'order', entityId: orderResult.insertId, req });

    const order = await getById(orderResult.insertId);
    const bill = await billingService.createBillFromOrder(order, userId);

    return { ...order, bill };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const updateStatus = async (id, { status, notes, trackingNumber }, userId, req) => {
  const order = await getById(id);
  const validTransitions = {
    pending: ['approved', 'cancelled'],
    approved: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  };
  if (!validTransitions[order.status]?.includes(status)) {
    throw new AppError(`Cannot transition from ${order.status} to ${status}`, 400);
  }

  const updates = ['status = ?'];
  const params = [status];
  if (status === 'approved') { updates.push('approved_by = ?', 'approved_at = NOW()'); params.push(userId); }
  if (trackingNumber) { updates.push('tracking_number = ?'); params.push(trackingNumber); }
  if (status === 'delivered') { updates.push('actual_delivery_date = CURDATE()'); }
  params.push(id);

  await db.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);
  await db.query(
    'INSERT INTO order_status_history (order_id, from_status, to_status, notes, changed_by) VALUES (?,?,?,?,?)',
    [id, order.status, status, notes, userId]
  );

  if (order.dealer_id) {
    await notifyDealer(order.dealer_id, { title: 'Order Update', message: `Order ${order.order_number} is now ${status}`, type: 'order_status' });
  }
  await createAuditLog({ userId, action: 'update_status', module: 'orders', entityType: 'order', entityId: id, newValues: { status }, req });

  return getById(id);
};

module.exports = { list, getById, create, updateStatus, listVariants };
