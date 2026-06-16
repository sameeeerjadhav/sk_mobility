const PDFDocument = require('pdfkit');

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

// ── Amount in words ──────────────────────────────────────────────────────────
const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
const twoDigits = (n) => n < 20 ? ones[n] : `${tens[Math.floor(n/10)]}${ones[n%10] ? ` ${ones[n%10]}` : ''}`.trim();
const convertNumber = (num) => {
  if (num === 0) return 'Zero';
  let n = Math.floor(num); const parts = [];
  if (n >= 10000000) { parts.push(`${convertNumber(Math.floor(n/10000000))} Crore`); n %= 10000000; }
  if (n >= 100000) { parts.push(`${convertNumber(Math.floor(n/100000))} Lakh`); n %= 100000; }
  if (n >= 1000) { parts.push(`${convertNumber(Math.floor(n/1000))} Thousand`); n %= 1000; }
  if (n >= 100) { parts.push(`${ones[Math.floor(n/100)]} Hundred`); n %= 100; }
  if (n > 0) parts.push(twoDigits(n));
  return parts.join(' ');
};
const amountInWords = (amount) => {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = `RS ${convertNumber(rupees)}`;
  if (paise > 0) words += ` AND ${convertNumber(paise)} PAISE`;
  return `${words} ONLY`;
};

// ── Helper to draw a label:value row ─────────────────────────────────────────
const labelRow = (doc, x, y, label, value, labelWidth = 130) => {
  doc.font('Helvetica').fontSize(9).fillColor('#000').text(label, x, y, { width: labelWidth, lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(9).text(`: ${value || '—'}`, x + labelWidth, y, { width: 200, lineBreak: false });
  return y + 16;
};

// ── Draw table cell ───────────────────────────────────────────────────────────
const cell = (doc, x, y, w, h, text, opts = {}) => {
  doc.rect(x, y, w, h).strokeColor('#000').lineWidth(0.5).stroke();
  const textY = y + (h - (opts.size || 8)) / 2;
  doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.size || 8)
    .fillColor(opts.color || '#000')
    .text(String(text || ''), x + 3, textY, { width: w - 6, align: opts.align || 'center', lineBreak: false });
};

const defaultCompany = {
  company_name: 'SK Mobility Pvt. Ltd.',
  company_address: 'Opp to Kanda Market Yeola 423401',
  company_phone: '9657378071',
  company_email: 'info@skmobility.com',
  gst_number: '27AABCS1234M1Z5',
  pan_number: 'AABCS1234M',
  dealer_code: '',
  brand_name: 'SK Mobility',
};

// ═══════════════════════════════════════════════════════════════════════════════
// VEHICLE TAX INVOICE — matches vehicle-invoice.html
// ═══════════════════════════════════════════════════════════════════════════════
const renderVehicleInvoice = (doc, { bill, items, company }) => {
  const c = { ...defaultCompany, ...company };
  const M = 40;
  const W = doc.page.width - M * 2;
  let y = M;

  // ── Top header: 3 columns ──
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000')
    .text('Branch Address :', M, y)
    .font('Helvetica').fontSize(8)
    .text(c.company_name, M, y + 12)
    .text(c.company_address, M, y + 22)
    .text(`Mobile : ${c.company_phone || '—'}`, M, y + 32)
    .text(`Email : ${c.company_email || '—'}`, M, y + 42);

  // Centre logo
  doc.font('Helvetica-BoldOblique').fontSize(30).fillColor('#000')
    .text(c.brand_name || 'Chetak', M + W / 2 - 60, y + 10, { width: 120, align: 'center' });

  // Right
  doc.font('Helvetica').fontSize(9).text('Original For Recipient', doc.page.width - M - 120, y + 10, { width: 120, align: 'right' });

  y += 65;

  // ── Centre info ──
  doc.font('Helvetica-Bold').fontSize(13).text(c.company_name, M, y, { width: W, align: 'center' });
  y += 18;
  if (c.dealer_code) {
    doc.font('Helvetica').fontSize(9).text(`Dealer's PM E-DRIVE Code : ${c.dealer_code}`, M, y, { width: W, align: 'center' });
    y += 14;
  }
  doc.font('Helvetica-Bold').fontSize(20).text('TAX INVOICE (Vehicle)', M, y, { width: W, align: 'center' });
  y += 30;

  // HR
  doc.moveTo(M, y).lineTo(M + W, y).strokeColor('#000').lineWidth(1).stroke();
  y += 10;

  // ── Two-column customer/vehicle details ──
  const col = W / 2;
  const startY = y;

  // Left: customer info
  const custFields = [
    ['Customer Type', bill.customer_type || 'Individual'],
    ['Customer Name', bill.customer_name],
    ['Customer Phone', bill.customer_phone],
    ['Customer Email', bill.customer_email],
    ['Customer Aadhaar', bill.customer_aadhaar],
    ['Customer PAN', bill.customer_pan],
  ];
  let leftY = startY;
  custFields.forEach(([lbl, val]) => { leftY = labelRow(doc, M, leftY, lbl, val); });

  // Right: invoice/vehicle info
  const invFields = [
    ['Invoice No.', bill.bill_number],
    ['Invoice Date', fmtDate(bill.issued_at)],
    ['Booking No.', bill.order_number],
    ['Chassis No.', bill.chassis_no],
    ['Battery Capacity', bill.battery_capacity],
    ['Motor No.', bill.motor_no],
    ['Color', bill.color],
  ];
  let rightY = startY;
  invFields.forEach(([lbl, val]) => { rightY = labelRow(doc, M + col + 10, rightY, lbl, val, 110); });

  y = Math.max(leftY, rightY) + 8;

  // ── Addresses ──
  doc.font('Helvetica-Bold').fontSize(9).text('Bill To Address', M, y);
  y += 14;
  doc.font('Helvetica').fontSize(8)
    .text(bill.customer_name || '—', M, y)
    .text(bill.customer_address || bill.delivery_address || '—', M, y + 11)
    .text(`Mobile : ${bill.customer_phone || '—'}`, M, y + 22);
  y += 40;

  doc.font('Helvetica-Bold').fontSize(9).text('Delivery Address', M, y);
  y += 12;
  doc.font('Helvetica').fontSize(8).text(c.company_address, M, y);
  y += 22;

  // ── Invoice table ──
  const cols = [
    { w: 22, label: 'S.No', align: 'center' },
    { w: 130, label: 'Model Name / HSN Code', align: 'left' },
    { w: 55, label: 'Unit Price', align: 'right' },
    { w: 25, label: 'Qty', align: 'center' },
    { w: 35, label: 'Disc', align: 'right' },
    { w: 65, label: 'Taxable Amt', align: 'right' },
    { w: 45, label: 'CGST', align: 'right' },
    { w: 45, label: 'SGST', align: 'right' },
    { w: 55, label: 'Amount', align: 'right' },
  ];
  const tW = cols.reduce((s, c2) => s + c2.w, 0);
  const tX = M + (W - tW) / 2;
  const H = 18;

  // Header row
  let cx = tX;
  cols.forEach(col2 => {
    cell(doc, cx, y, col2.w, H, col2.label, { bold: true, size: 7, color: '#000' });
    cx += col2.w;
  });
  y += H;

  const taxRate = items[0]?.tax_rate || 18;
  const cgstRate = taxRate / 2;
  const sgstRate = taxRate / 2;

  // Data rows
  items.forEach((item, i) => {
    const cgst = Number(item.tax_amount || 0) / 2;
    const sgst = cgst;
    const lineTotal = Number(item.total_amount) + Number(item.tax_amount || 0);
    const vals = [
      i + 1,
      `${item.description} / ${item.hsn_code || '87116020'}`,
      fmt(item.unit_price),
      item.quantity,
      fmt(item.discount || 0),
      fmt(item.total_amount),
      fmt(cgst),
      fmt(sgst),
      fmt(lineTotal),
    ];
    cx = tX;
    cols.forEach((col2, j) => {
      cell(doc, cx, y, col2.w, H, vals[j], { size: 7, align: col2.align });
      cx += col2.w;
    });
    y += H;
  });

  // Round off
  cx = tX;
  [cols[0].w, cols[1].w].forEach((w, i) => { cell(doc, cx, y, w, H, i === 0 ? items.length + 1 : 'Round Off', { size: 7, align: i === 0 ? 'center' : 'left' }); cx += w; });
  cell(doc, cx, y, tW - cols[0].w - cols[1].w - cols[8].w, H, '', { size: 7 });
  cx = tX + tW - cols[8].w;
  cell(doc, cx, y, cols[8].w, H, 'NA', { size: 7 });
  y += H;

  // PM incentive
  const pmInc = Number(bill.pm_drive_incentive || 0);
  const stSub = Number(bill.state_subsidy || 0);
  let rowNum = items.length + 2;

  if (pmInc > 0) {
    cx = tX;
    cell(doc, cx, y, cols[0].w, H, rowNum++, { size: 7 }); cx += cols[0].w;
    cell(doc, cx, y, cols[1].w, H, 'PM E-DRIVE Incentive from Govt. of India', { size: 7, align: 'left' }); cx += cols[1].w;
    cell(doc, cx, y, tW - cols[0].w - cols[1].w - cols[8].w, H, ''); 
    cx = tX + tW - cols[8].w;
    cell(doc, cx, y, cols[8].w, H, `-${fmt(pmInc)}`, { size: 7 });
    y += H;
  }

  // Sub total 1
  const sub1 = Number(bill.total_amount) - stSub;
  cx = tX;
  cell(doc, cx, y, cols[0].w, H, rowNum++, { size: 7 }); cx += cols[0].w;
  cell(doc, cx, y, cols[1].w, H, 'Sub Total', { size: 7, align: 'left' }); cx += cols[1].w;
  cell(doc, cx, y, tW - cols[0].w - cols[1].w - cols[8].w, H, '');
  cx = tX + tW - cols[8].w;
  cell(doc, cx, y, cols[8].w, H, fmt(sub1), { size: 7 });
  y += H;

  // State subsidy
  cx = tX;
  cell(doc, cx, y, cols[0].w, H, rowNum++, { size: 7 }); cx += cols[0].w;
  cell(doc, cx, y, cols[1].w, H, 'State Govt. Subsidy', { size: 7, align: 'left' }); cx += cols[1].w;
  cell(doc, cx, y, tW - cols[0].w - cols[1].w - cols[8].w, H, '');
  cx = tX + tW - cols[8].w;
  cell(doc, cx, y, cols[8].w, H, stSub > 0 ? `-${fmt(stSub)}` : 'NA', { size: 7 });
  y += H;

  // Total row
  cx = tX;
  cell(doc, cx, y, cols[0].w, H, rowNum, { size: 7 }); cx += cols[0].w;
  cell(doc, cx, y, cols[1].w, H, 'Total Amount', { size: 7, bold: true, align: 'left' }); cx += cols[1].w;
  cell(doc, cx, y, tW - cols[0].w - cols[1].w - cols[8].w, H, '');
  cx = tX + tW - cols[8].w;
  cell(doc, cx, y, cols[8].w, H, fmt(bill.total_amount), { size: 8, bold: true });
  y += H + 10;

  // ── Amount in words ──
  const words = bill.amount_in_words || amountInWords(Number(bill.total_amount));
  doc.rect(M, y, W, 22).strokeColor('#000').lineWidth(0.5).stroke();
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#000').text('AMOUNT IN WORDS : ', M + 6, y + 7, { continued: true });
  doc.font('Helvetica').fontSize(8).text(words);
  y += 32;

  // ── Terms ──
  doc.font('Helvetica-Bold').fontSize(8).text('Terms and Conditions :', M, y);
  y += 12;
  doc.font('Helvetica').fontSize(7)
    .text('a. Terms and conditions as agreed by you during online booking shall apply.', M, y)
    .text('b. Subsidies applicable, if any, are subject to approval from respective Government departments.', M, y + 11)
    .text('c. Ex-showroom price is inclusive of charger and charging cable.', M, y + 22);
  y += 42;

  // ── Footer ──
  doc.font('Helvetica-Bold').fontSize(9).text(`For ${c.company_name}`, M, y, { width: W, align: 'right' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXTENDED WARRANTY CERTIFICATE — matches extended-warranty.html
// ═══════════════════════════════════════════════════════════════════════════════
const renderWarrantyCertificate = (doc, { bill, items, company }) => {
  const c = { ...defaultCompany, ...company };
  const M = 30;
  const W = doc.page.width - M * 2;
  let y = M;

  // Top label
  doc.font('Helvetica').fontSize(10).fillColor('#000').text('Tax Invoice', M, y);
  y += 20;

  // ── Dark banner ──
  const bannerH = 90;
  doc.rect(M, y, W, bannerH).fill('#1d1d1d');

  // Left: CW logo
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#fff')
    .text('CW', M + 10, y + 15)
    .fontSize(9).text('CORPORATE WARRANTY', M + 10, y + 32, { width: 100 });

  // Center: company address
  doc.font('Helvetica').fontSize(9).fillColor('#fff')
    .text(c.company_name, M + W / 2 - 80, y + 12, { width: 160, align: 'center' })
    .text(c.company_address || '—', M + W / 2 - 80, y + 26, { width: 160, align: 'center' })
    .text(c.company_email || '—', M + W / 2 - 80, y + 50, { width: 160, align: 'center' });

  // Right: brand logo
  doc.font('Helvetica-BoldOblique').fontSize(26).fillColor('#fff')
    .text(c.brand_name || 'Chetak', doc.page.width - M - 110, y + 25, { width: 100, align: 'right' });

  y += bannerH + 18;

  // Certificate title
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#000')
    .text('EXTENDED WARRANTY CERTIFICATE', M, y, { width: W, align: 'center' });
  y += 28;

  // ── Two-column info grid ──
  const col = W / 2 - 10;
  const startY = y;
  const LW = 120;

  // Left column
  const leftFields = [
    ['GSTIN', c.gst_number],
    ['Invoice No.', bill.bill_number],
    ['Invoice Date', fmtDate(bill.issued_at)],
    ['Registration No.', bill.registration_no],
    ['Customer Name', bill.customer_name],
    ['Mobile', bill.customer_phone],
    ['Customer Address', bill.customer_address],
    ['City', bill.customer_city],
    ['State', bill.customer_state || 'Maharashtra'],
    ['State Code', bill.state_code || 'MH'],
  ];
  let lY = startY;
  leftFields.forEach(([lbl, val]) => { lY = labelRow(doc, M, lY, lbl, val, LW); });

  // Right column
  const rightFields = [
    ['SAC Code', bill.sac_code || '999799'],
    ['Registration', bill.chassis_registration],
    ['Date Of Vehicle Sale', fmtDate(bill.vehicle_sale_date || bill.issued_at)],
    ['Odometer Reading', bill.odometer_reading],
    ['Chassis No.', bill.chassis_no],
    ['Engine No.', bill.motor_no],
    ['Model', bill.vehicle_model],
    ['Comments', bill.comments],
    ['Period Of Cover', bill.warranty_period || '24 Months'],
  ];
  let rY = startY;
  rightFields.forEach(([lbl, val]) => { rY = labelRow(doc, M + col + 20, rY, lbl, val, LW); });

  y = Math.max(lY, rY) + 10;

  // ── Details table ──
  const taxRate = items[0]?.tax_rate || 18;
  const cgstRate = taxRate / 2;
  const sgstRate = taxRate / 2;
  const cgst = Number(bill.tax_amount || 0) / 2;
  const sgst = cgst;

  const tCols = [
    { label: 'Programme Type', w: 80 },
    { label: 'Start Date', w: 65 },
    { label: 'Expiry Date', w: 65 },
    { label: 'Rate', w: 55 },
    { label: 'Taxable Amount', w: 65 },
    { label: `CGST (${cgstRate}%)`, w: 55 },
    { label: `SGST (${sgstRate}%)`, w: 55 },
    { label: 'Amount', w: 60 },
  ];
  const tW = tCols.reduce((s, tc) => s + tc.w, 0);
  const tX = M + (W - tW) / 2;
  const H = 20;

  let cx = tX;
  tCols.forEach(tc => { cell(doc, cx, y, tc.w, H, tc.label, { bold: true, size: 7 }); cx += tc.w; });
  y += H;

  // Data row
  const dataItems = items.length > 0 ? items : [{ description: 'EW', total_amount: Number(bill.subtotal || 0) }];
  dataItems.forEach((it) => {
    const itCgst = Number(it.tax_amount || 0) / 2 || cgst;
    const itSgst = itCgst;
    const itTotal = Number(it.total_amount || bill.subtotal || 0) + Number(it.tax_amount || 0);
    const vals = [
      it.programme_type || 'EW',
      fmtDate(it.warranty_start || bill.warranty_start),
      fmtDate(it.warranty_end || bill.warranty_end),
      fmt(it.unit_price || it.total_amount || bill.subtotal),
      fmt(it.total_amount || bill.subtotal),
      fmt(itCgst),
      fmt(itSgst),
      fmt(itTotal),
    ];
    cx = tX;
    tCols.forEach((tc, j) => { cell(doc, cx, y, tc.w, H, vals[j], { size: 7 }); cx += tc.w; });
    y += H;
  });

  // Total row
  cx = tX;
  cell(doc, cx, y, tCols[0].w + tCols[1].w + tCols[2].w, H, 'TOTAL', { bold: true, size: 8 });
  cx += tCols[0].w + tCols[1].w + tCols[2].w;
  cell(doc, cx, y, tCols[3].w, H, fmt(bill.subtotal), { size: 7 }); cx += tCols[3].w;
  cell(doc, cx, y, tCols[4].w, H, fmt(bill.subtotal), { size: 7 }); cx += tCols[4].w;
  cell(doc, cx, y, tCols[5].w, H, fmt(cgst), { size: 7 }); cx += tCols[5].w;
  cell(doc, cx, y, tCols[6].w, H, fmt(sgst), { size: 7 }); cx += tCols[6].w;
  cell(doc, cx, y, tCols[7].w, H, fmt(bill.total_amount), { bold: true, size: 8 }); 
  y += H + 14;

  // Total payable
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#000')
    .text(`Total Payable Amount : ${fmt(bill.total_amount)}`, M, y, { width: W, align: 'right' });
  y += 24;

  // Amount in words
  const words = bill.amount_in_words || amountInWords(Number(bill.total_amount));
  doc.font('Helvetica-Bold').fontSize(9).text('Amount In Words : ', M, y, { continued: true });
  doc.font('Helvetica').fontSize(9).text(words);
  y += 50;

  // Footer
  doc.font('Helvetica-Bold').fontSize(10).text('Dealer Name & Stamp', M, y);
};

// ── Router — picks the right template ────────────────────────────────────────
const renderTaxInvoice = (doc, { bill, items, company }) => {
  if (bill.bill_type === 'warranty') {
    return renderWarrantyCertificate(doc, { bill, items, company });
  }
  return renderVehicleInvoice(doc, { bill, items, company });
};

module.exports = { renderTaxInvoice, renderVehicleInvoice, renderWarrantyCertificate, amountInWords, fmt };
