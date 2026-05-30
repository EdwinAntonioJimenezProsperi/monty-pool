const express = require('express');
const { getDb } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const tables = db.prepare('SELECT * FROM tables_config ORDER BY id').all();

  const enriched = tables.map(table => {
    if (table.status === 'occupied' && table.started_at) {
      const startTime = new Date(table.started_at + 'Z');
      const now = new Date();
      const diffMs = now - startTime;
      const diffMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      // Cobro proporcional (regla de 3 simple): 60 min = price_per_hour
      const estimatedTotal = Math.round((diffMinutes * table.price_per_hour / 60) * 100) / 100;

      return {
        ...table,
        elapsed_minutes: diffMinutes,
        elapsed_display: `${hours}h ${minutes}m`,
        estimated_total: estimatedTotal
      };
    }
    return { ...table, elapsed_minutes: 0, elapsed_display: '0h 0m', estimated_total: 0 };
  });

  res.json(enriched);
});

router.post('/:id/start', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const table = db.prepare('SELECT * FROM tables_config WHERE id = ?').get(id);
  if (!table) {
    return res.status(404).json({ error: 'Mesa no encontrada' });
  }

  if (table.status === 'occupied') {
    return res.status(400).json({ error: 'La mesa ya está ocupada' });
  }

  const now = new Date().toISOString().replace('Z', '').split('.')[0];

  const sessionResult = db.prepare(
    'INSERT INTO table_sessions (table_id, started_at, user_id) VALUES (?, ?, ?)'
  ).run(id, now, req.user.id);

  db.prepare(
    'UPDATE tables_config SET status = ?, started_at = ?, current_session_id = ? WHERE id = ?'
  ).run('occupied', now, sessionResult.lastInsertRowid, id);

  const updated = db.prepare('SELECT * FROM tables_config WHERE id = ?').get(id);
  res.json(updated);
});

router.post('/:id/stop', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const table = db.prepare('SELECT * FROM tables_config WHERE id = ?').get(id);
  if (!table) {
    return res.status(404).json({ error: 'Mesa no encontrada' });
  }

  if (table.status !== 'occupied') {
    return res.status(400).json({ error: 'La mesa no está ocupada' });
  }

  const startTime = new Date(table.started_at + 'Z');
  const now = new Date();
  const diffMs = now - startTime;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  // Cobro proporcional (regla de 3 simple): 60 min = price_per_hour
  const total = Math.round((diffMinutes * table.price_per_hour / 60) * 100) / 100;

  const endTime = now.toISOString().replace('Z', '').split('.')[0];

  if (table.current_session_id) {
    db.prepare(
      'UPDATE table_sessions SET ended_at = ?, duration_minutes = ?, total = ? WHERE id = ?'
    ).run(endTime, diffMinutes, total, table.current_session_id);
  }

  db.prepare(
    'UPDATE tables_config SET status = ?, started_at = NULL, current_session_id = NULL WHERE id = ?'
  ).run('available', id);

  res.json({
    table_id: parseInt(id),
    duration_minutes: diffMinutes,
    total,
    message: `Mesa ${table.name} liberada. Tiempo: ${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m. Total: Bs ${total.toFixed(2)}`
  });
});

router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, price_per_hour, price_per_half_hour } = req.body;
  const db = getDb();

  const table = db.prepare('SELECT * FROM tables_config WHERE id = ?').get(id);
  if (!table) {
    return res.status(404).json({ error: 'Mesa no encontrada' });
  }

  db.prepare(
    'UPDATE tables_config SET name = ?, price_per_hour = ?, price_per_half_hour = ? WHERE id = ?'
  ).run(
    name || table.name,
    price_per_hour !== undefined ? parseFloat(price_per_hour) : table.price_per_hour,
    price_per_half_hour !== undefined ? parseFloat(price_per_half_hour) : table.price_per_half_hour,
    id
  );

  const updated = db.prepare('SELECT * FROM tables_config WHERE id = ?').get(id);
  res.json(updated);
});

router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { name, price_per_hour, price_per_half_hour } = req.body;
  const db = getDb();

  if (!name) {
    return res.status(400).json({ error: 'Nombre de mesa es requerido' });
  }

  const result = db.prepare(
    'INSERT INTO tables_config (name, price_per_hour, price_per_half_hour) VALUES (?, ?, ?)'
  ).run(name, price_per_hour || 20, price_per_half_hour || 10);

  const table = db.prepare('SELECT * FROM tables_config WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(table);
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const table = db.prepare('SELECT * FROM tables_config WHERE id = ?').get(id);
  if (!table) {
    return res.status(404).json({ error: 'Mesa no encontrada' });
  }

  if (table.status === 'occupied') {
    return res.status(400).json({ error: 'No se puede eliminar una mesa ocupada' });
  }

  db.prepare('DELETE FROM tables_config WHERE id = ?').run(id);
  res.json({ message: 'Mesa eliminada' });
});

module.exports = router;
