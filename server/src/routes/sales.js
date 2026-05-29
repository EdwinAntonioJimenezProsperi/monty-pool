const express = require('express');
const { getDb } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, (req, res) => {
  const { product_id, quantity, table_id } = req.body;

  if (!product_id || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'Producto y cantidad son requeridos' });
  }

  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(product_id);

  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  if (product.stock < quantity) {
    return res.status(400).json({ error: `Stock insuficiente. Disponible: ${product.stock}` });
  }

  const total = product.price * quantity;

  const sale = db.transaction(() => {
    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, product_id);

    const result = db.prepare(
      'INSERT INTO sales (product_id, quantity, unit_price, total, user_id, table_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(product_id, quantity, product.price, total, req.user.id, table_id || null);

    return db.prepare(`
      SELECT s.*, p.name as product_name
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);
  })();

  res.status(201).json(sale);
});

router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { from, to, limit: queryLimit } = req.query;
  const limit = parseInt(queryLimit) || 100;

  let query = `
    SELECT s.*, p.name as product_name, u.username as sold_by,
           t.name as table_name
    FROM sales s
    JOIN products p ON s.product_id = p.id
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN tables_config t ON s.table_id = t.id
  `;
  const params = [];
  const conditions = [];

  if (from) {
    conditions.push('s.created_at >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('s.created_at <= ?');
    params.push(to);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY s.created_at DESC LIMIT ?';
  params.push(limit);

  const sales = db.prepare(query).all(...params);
  res.json(sales);
});

router.get('/summary', authenticateToken, (req, res) => {
  const db = getDb();
  const { from, to } = req.query;

  let dateFilter = '';
  const params = [];

  if (from) {
    dateFilter += ' AND created_at >= ?';
    params.push(from);
  }
  if (to) {
    dateFilter += ' AND created_at <= ?';
    params.push(to);
  }

  const totalSales = db.prepare(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count FROM sales WHERE 1=1 ${dateFilter}`
  ).get(...params);

  const topProducts = db.prepare(`
    SELECT p.name, SUM(s.quantity) as total_qty, SUM(s.total) as total_revenue
    FROM sales s
    JOIN products p ON s.product_id = p.id
    WHERE 1=1 ${dateFilter}
    GROUP BY s.product_id
    ORDER BY total_qty DESC
    LIMIT 10
  `).all(...params);

  let tableDateFilter = '';
  const tableParams = [];
  if (from) {
    tableDateFilter += ' AND started_at >= ?';
    tableParams.push(from);
  }
  if (to) {
    tableDateFilter += ' AND ended_at <= ?';
    tableParams.push(to);
  }

  const tableRevenue = db.prepare(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as sessions
     FROM table_sessions WHERE ended_at IS NOT NULL ${tableDateFilter}`
  ).get(...tableParams);

  res.json({
    product_sales: totalSales,
    table_revenue: tableRevenue,
    grand_total: totalSales.total + tableRevenue.total,
    top_products: topProducts
  });
});

module.exports = router;
