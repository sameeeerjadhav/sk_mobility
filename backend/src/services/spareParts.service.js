const db = require('../config/database');
const { AppError, paginate, paginatedResponse } = require('../utils/helpers');
const { notifyAdmins } = require('./notification.service');

const listParts = async (filters = {}) => {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  let where = 'WHERE sp.is_active = 1';
  const params = [];
  if (filters.categoryId) { where += ' AND sp.category_id = ?'; params.push(filters.categoryId); }

  const [count] = await db.query(`SELECT COUNT(*) AS total FROM spare_parts sp ${where}`, params);
  const [rows] = await db.query(
    `SELECT sp.*, spc.name AS category_name FROM spare_parts sp
     JOIN spare_part_categories spc ON sp.category_id = spc.id ${where}
     ORDER BY sp.name LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return paginatedResponse(rows, count[0].total, page, limit);
};

const listStock = async (filters = {}) => {
  const [rows] = await db.query(
    `SELECT ss.*, sp.name AS part_name, sp.part_number, w.name AS warehouse_name,
            CASE WHEN ss.quantity <= ss.low_stock_threshold THEN 1 ELSE 0 END AS is_low_stock
     FROM spare_stock ss JOIN spare_parts sp ON ss.spare_part_id = sp.id
     JOIN warehouses w ON ss.warehouse_id = w.id
     ${filters.lowStock ? 'WHERE ss.quantity <= ss.low_stock_threshold' : ''}
     ORDER BY is_low_stock DESC`
  );
  return rows;
};

const recordUsage = async (data, userId) => {
  const [stock] = await db.query(
    'SELECT * FROM spare_stock WHERE warehouse_id = ? AND spare_part_id = ? FOR UPDATE',
    [data.warehouseId, data.sparePartId]
  );
  if (!stock.length || stock[0].quantity < data.quantity) throw new AppError('Insufficient spare parts stock', 400);

  await db.query('UPDATE spare_stock SET quantity = quantity - ? WHERE id = ?', [data.quantity, stock[0].id]);
  await db.query(
    'INSERT INTO spare_usage (spare_part_id, job_card_id, warehouse_id, quantity, unit_cost, notes, used_by) VALUES (?,?,?,?,?,?,?)',
    [data.sparePartId, data.jobCardId, data.warehouseId, data.quantity, data.unitCost, data.notes, userId]
  );

  const [updated] = await db.query('SELECT quantity, low_stock_threshold FROM spare_stock WHERE id = ?', [stock[0].id]);
  if (updated[0].quantity <= updated[0].low_stock_threshold) {
    await notifyAdmins({ title: 'Spare Parts Low Stock', message: `Part ID ${data.sparePartId} is low`, type: 'low_stock', channels: ['in_app'] });
  }
};

const listCategories = async () => {
  const [rows] = await db.query('SELECT * FROM spare_part_categories WHERE is_active = 1');
  return rows;
};

const createPart = async (body) => {
  const { name, part_number, category_id, unit_price, description } = body;
  if (!name?.trim()) throw new AppError('Part name is required', 400);
  if (!part_number?.trim()) throw new AppError('Part number is required', 400);
  const [result] = await db.query(
    'INSERT INTO spare_parts (name, part_number, category_id, unit_price, description, is_active) VALUES (?,?,?,?,?,1)',
    [name.trim(), part_number.trim(), category_id, unit_price || 0, description || null]
  );
  const [rows] = await db.query(
    'SELECT sp.*, spc.name AS category_name FROM spare_parts sp JOIN spare_part_categories spc ON sp.category_id = spc.id WHERE sp.id = ?',
    [result.insertId]
  );
  return rows[0];
};

const updatePart = async (id, body) => {
  const fields = ['name', 'part_number', 'category_id', 'unit_price', 'description'];
  const updates = fields.filter((f) => body[f] !== undefined).map((f) => `${f} = ?`);
  const vals = fields.filter((f) => body[f] !== undefined).map((f) => body[f]);
  if (!updates.length) throw new AppError('No fields to update', 400);
  await db.query(`UPDATE spare_parts SET ${updates.join(', ')} WHERE id = ?`, [...vals, id]);
  const [rows] = await db.query(
    'SELECT sp.*, spc.name AS category_name FROM spare_parts sp JOIN spare_part_categories spc ON sp.category_id = spc.id WHERE sp.id = ?',
    [id]
  );
  return rows[0];
};

const deletePart = async (id) => {
  await db.query('UPDATE spare_parts SET is_active = 0 WHERE id = ?', [id]);
};

module.exports = { listParts, listStock, recordUsage, listCategories, createPart, updatePart, deletePart };

