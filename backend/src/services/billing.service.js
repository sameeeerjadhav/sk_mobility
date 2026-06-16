const db = require('../config/database');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { AppError, generateOrderNumber } = require('../utils/helpers');
const { renderTaxInvoice } = require('../utils/invoicePdf');

const toPublicPath = (filePath) => filePath.replace(/\\/g, '/');

const getCompanySettings = async () => {
  const [rows] = await db.query('SELECT setting_key, setting_value FROM system_settings');
  return rows.reduce((acc, r) => ({ ...acc, [r.setting_key]: r.setting_value }), {});
};

const fetchBillData = async (billId) => {
  const [bills] = await db.query(
    `SELECT b.*, o.order_number, o.order_type,
            o.customer_name, o.customer_phone, o.customer_email,
            o.delivery_address, o.chassis_no, o.motor_no, o.battery_capacity,
            o.color, o.customer_aadhaar, o.customer_pan, o.customer_address,
            o.pm_drive_incentive, o.state_subsidy,
            d.business_name AS dealer_name, d.dealer_code, d.gst_number AS dealer_gst,
            d.phone AS dealer_phone, d.email AS dealer_email, d.pan_number AS dealer_pan
     FROM bills b
     LEFT JOIN orders o ON b.order_id = o.id
     LEFT JOIN dealers d ON b.dealer_id = d.id
     WHERE b.id = ?`,
    [billId]
  );
  if (!bills.length) throw new AppError('Bill not found', 404);

  const [dealerAddr] = bills[0].dealer_id
    ? await db.query(
      'SELECT CONCAT(address_line1, ", ", city, ", ", state, " - ", pincode) AS addr FROM dealer_addresses WHERE dealer_id = ? AND is_primary = 1 LIMIT 1',
      [bills[0].dealer_id]
    )
    : [[]];

  const bill = {
    ...bills[0],
    dealer_address: dealerAddr[0]?.addr || null,
    // merge vehicle fields from bills table overriding order fields if set
    chassis_no: bills[0].chassis_no || null,
    motor_no: bills[0].motor_no || null,
    battery_capacity: bills[0].battery_capacity || null,
    color: bills[0].color || null,
    customer_aadhaar: bills[0].customer_aadhaar || null,
    customer_pan: bills[0].customer_pan || null,
    customer_address: bills[0].customer_address || bills[0].delivery_address || null,
    pm_drive_incentive: bills[0].pm_drive_incentive || 0,
    state_subsidy: bills[0].state_subsidy || 0,
    amount_in_words: bills[0].amount_in_words || null,
    vehicle_model: bills[0].vehicle_model || null,
    registration_no: bills[0].registration_no || null,
    sac_code: bills[0].sac_code || '999799',
    warranty_start: bills[0].warranty_start || null,
    warranty_end: bills[0].warranty_end || null,
    warranty_period: bills[0].warranty_period || null,
    customer_city: bills[0].customer_city || null,
    customer_state: bills[0].customer_state || 'Maharashtra',
    state_code: bills[0].state_code || 'MH',
  };

  const [items] = await db.query('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY id', [billId]);
  const company = await getCompanySettings();

  return { bill, items, company };
};

const createBill = async (data, userId) => {
  const billNumber = generateOrderNumber('BILL');
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO bills (bill_number, bill_type, dealer_id, order_id, service_request_id,
       subtotal, discount_amount, tax_amount, total_amount, status, notes, issued_at, created_by,
       chassis_no, motor_no, battery_capacity, color, customer_aadhaar, customer_pan,
       customer_address, pm_drive_incentive, state_subsidy, amount_in_words, vehicle_model,
       registration_no, sac_code, odometer_reading, vehicle_sale_date, chassis_registration,
       warranty_start, warranty_end, warranty_period, customer_city, customer_state, state_code)
       VALUES (?,?,?,?,?,?,?,?,?,'issued',?,NOW(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [billNumber, data.billType || 'vehicle', data.dealerId, data.orderId, data.serviceRequestId,
        data.subtotal, data.discountAmount || 0, data.taxAmount || 0, data.totalAmount, data.notes, userId,
        data.chassisNo || null, data.motorNo || null, data.batteryCapacity || null,
        data.color || null, data.customerAadhaar || null, data.customerPan || null,
        data.customerAddress || null, data.pmDriveIncentive || 0, data.stateSubsidy || 0,
        data.amountInWords || null, data.vehicleModel || null,
        data.registrationNo || null, data.sacCode || '999799', data.odometerReading || null,
        data.vehicleSaleDate || null, data.chassisRegistration || null,
        data.warrantyStart || null, data.warrantyEnd || null, data.warrantyPeriod || null,
        data.customerCity || null, data.customerState || 'Maharashtra', data.stateCode || 'MH',
      ]
    );

    for (const item of data.items || []) {
      await conn.query(
        `INSERT INTO bill_items (bill_id, item_type, description, quantity, unit_price, tax_rate, tax_amount, total_amount, reference_id)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [result.insertId, item.itemType, item.description, item.quantity, item.unitPrice,
          item.taxRate || 0, item.taxAmount || 0, item.totalAmount, item.referenceId]
      );
    }

    await conn.commit();
    return { id: result.insertId, billNumber };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const createBillFromOrder = async (order, userId) => {
  const [existing] = await db.query('SELECT id, bill_number FROM bills WHERE order_id = ?', [order.id]);
  if (existing.length) {
    const pdfPath = await ensureBillPdf(existing[0].id);
    return { id: existing[0].id, billNumber: existing[0].bill_number, pdfPath, alreadyExists: true };
  }

  const taxRate = order.subtotal > 0
    ? Number(((order.tax_amount / order.subtotal) * 100).toFixed(2))
    : 18;

  const items = (order.items || []).map((item) => {
    const lineTax = order.subtotal > 0
      ? Number(((item.total_price / order.subtotal) * order.tax_amount).toFixed(2))
      : 0;
    return {
      itemType: 'vehicle',
      description: `${item.vehicle_name} — ${item.variant_name} (${item.sku})`,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      taxRate,
      taxAmount: lineTax,
      totalAmount: Number(item.total_price),
      referenceId: item.variant_id,
    };
  });

  const partyLabel = order.order_type === 'customer'
    ? `Customer: ${order.customer_name} | ${order.customer_phone}`
    : `Dealer: ${order.dealer_name || 'N/A'}`;

  const vehicleModel = items.map(i => i.description).join(', ');
  const totalAfterSubsidy = order.total_amount - (order.pm_drive_incentive || 0) - (order.state_subsidy || 0);
  const { amountInWords: aw } = require('../utils/invoicePdf');
  const amtWords = aw(totalAfterSubsidy);

  const bill = await createBill({
    billType: 'vehicle',
    dealerId: order.dealer_id || null,
    orderId: order.id,
    subtotal: order.subtotal,
    discountAmount: order.discount_amount || 0,
    taxAmount: order.tax_amount || 0,
    totalAmount: order.total_amount,
    notes: `Auto-generated for order ${order.order_number}. ${partyLabel}`,
    // vehicle-specific
    chassisNo: order.chassis_no,
    motorNo: order.motor_no,
    batteryCapacity: order.battery_capacity,
    color: order.color,
    customerAadhaar: order.customer_aadhaar,
    customerPan: order.customer_pan,
    customerAddress: order.customer_address || order.delivery_address,
    pmDriveIncentive: order.pm_drive_incentive || 0,
    stateSubsidy: order.state_subsidy || 0,
    amountInWords: amtWords,
    vehicleModel,
    items,
  }, userId);

  const pdfPath = await generatePDF(bill.id);
  return { id: bill.id, billNumber: bill.billNumber, pdfPath: pdfPath.pdfPath };
};

const ensureBillPdf = async (billId) => {
  const [bills] = await db.query('SELECT pdf_path FROM bills WHERE id = ?', [billId]);
  if (bills[0]?.pdf_path) {
    const fullPath = bills[0].pdf_path.includes('uploads/')
      ? path.join(process.cwd(), bills[0].pdf_path.replace(/\//g, path.sep))
      : bills[0].pdf_path;
    if (fs.existsSync(fullPath)) return bills[0].pdf_path;
  }
  const result = await generatePDF(billId);
  return result.pdfPath;
};

const generatePDF = async (billId) => {
  const { bill, items, company } = await fetchBillData(billId);

  const uploadDir = path.join(process.cwd(), 'uploads', 'invoices');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const pdfPath = path.join(uploadDir, `${bill.bill_number}.pdf`);
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  renderTaxInvoice(doc, { bill, items, company });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const publicPath = toPublicPath(pdfPath);
  const relIdx = publicPath.indexOf('uploads/');
  const storedPath = relIdx >= 0 ? publicPath.slice(relIdx) : `uploads/invoices/${bill.bill_number}.pdf`;
  await db.query('UPDATE bills SET pdf_path = ?, status = ? WHERE id = ?', [storedPath, 'issued', billId]);

  return { pdfPath: storedPath };
};

const getBillDetail = async (billId) => {
  const { bill, items, company } = await fetchBillData(billId);
  const taxRate = items[0]?.tax_rate || 18;
  return {
    bill,
    items,
    company,
    taxSummary: {
      cgstRate: taxRate / 2,
      sgstRate: taxRate / 2,
      cgstAmount: Number(bill.tax_amount) / 2,
      sgstAmount: Number(bill.tax_amount) / 2,
    },
  };
};

const listBills = async (filters = {}) => {
  let where = 'WHERE 1=1';
  const params = [];
  if (filters.dealerId) { where += ' AND b.dealer_id = ?'; params.push(filters.dealerId); }
  if (filters.orderId) { where += ' AND b.order_id = ?'; params.push(filters.orderId); }

  const [rows] = await db.query(
    `SELECT b.*, o.order_number, o.order_type, o.customer_name, o.customer_phone,
            d.business_name AS dealer_name
     FROM bills b
     LEFT JOIN orders o ON b.order_id = o.id
     LEFT JOIN dealers d ON b.dealer_id = d.id
     ${where}
     ORDER BY b.created_at DESC LIMIT 100`,
    params
  );
  return rows;
};

const listTaxes = async () => {
  const [rows] = await db.query('SELECT * FROM taxes WHERE is_active = 1');
  return rows;
};

const createWarrantyBill = async (data, userId) => {
  const { amountInWords: aw } = require('../utils/invoicePdf');
  const totalAmt = Number(data.totalAmount || 0);
  const taxAmt = Number(data.taxAmount || 0);
  const subtotal = totalAmt - taxAmt;

  const bill = await createBill({
    billType: 'warranty',
    dealerId: data.dealerId || null,
    orderId: null,
    serviceRequestId: null,
    subtotal,
    discountAmount: 0,
    taxAmount: taxAmt,
    totalAmount: totalAmt,
    notes: data.notes || 'Extended Warranty Certificate',
    customerAadhaar: data.customerAadhaar,
    customerPan: data.customerPan,
    customerAddress: data.customerAddress,
    customerCity: data.customerCity,
    customerState: data.customerState || 'Maharashtra',
    stateCode: data.stateCode || 'MH',
    chassisNo: data.chassisNo,
    motorNo: data.motorNo,
    batteryCapacity: data.batteryCapacity,
    color: data.color,
    vehicleModel: data.vehicleModel,
    registrationNo: data.registrationNo,
    sacCode: data.sacCode || '999799',
    odometerReading: data.odometerReading,
    vehicleSaleDate: data.vehicleSaleDate,
    chassisRegistration: data.chassisRegistration,
    warrantyStart: data.warrantyStart,
    warrantyEnd: data.warrantyEnd,
    warrantyPeriod: data.warrantyPeriod,
    amountInWords: aw(totalAmt),
    items: [{
      itemType: 'warranty',
      description: `Extended Warranty (${data.warrantyPeriod || '24 Months'}) — ${data.vehicleModel || 'Vehicle'}`,
      quantity: 1,
      unitPrice: subtotal,
      taxRate: data.taxRate || 18,
      taxAmount: taxAmt,
      totalAmount: subtotal,
    }],
  }, userId);

  const pdfPath = await generatePDF(bill.id);
  return { id: bill.id, billNumber: bill.billNumber, pdfPath: pdfPath.pdfPath };
};

module.exports = {
  createBill, createBillFromOrder, createWarrantyBill, generatePDF, getBillDetail, listBills, listTaxes,
};
