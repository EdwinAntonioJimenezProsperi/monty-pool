const express = require('express');
const { all, get, run, asyncHandler } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const tables = await all('SELECT * FROM tables_config ORDER BY id');

  const enriched = tables.map(table => {
    if (table.status === 'occupied' && table.started_at) {
      const startTime = new Date(table.started_at);
      const now = new Date();
      const diffMs = now - startTime;
      const diffMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      // Cobro proporcional (regla de 3 simple): 60 min = price_per_hour.
      // Se redondea a bolivianos enteros (no hay denominaciones < Bs 1 utiles).
      const estimatedTotal = Math.round(diffMinutes * table.price_per_hour / 60);

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
}));

router.post('/:id/start', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const table = await get('SELECT * FROM tables_config WHERE id = ?', [id]);
  if (!table) {
    return res.status(404).json({ error: 'Mesa no encontrada' });
  }

  if (table.status === 'occupied') {
    return res.status(400).json({ error: 'La mesa ya está ocupada' });
  }

  const session = await get(
    'INSERT INTO table_sessions (table_id, started_at, user_id) VALUES (?, now(), ?) RETURNING id, started_at',
    [id, req.user.id]
  );

  const updated = await get(
    'UPDATE tables_config SET status = ?, started_at = ?, current_session_id = ? WHERE id = ? RETURNING *',
    ['occupied', session.started_at, session.id, id]
  );

  res.json(updated);
}));

router.post('/:id/stop', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const table = await get('SELECT * FROM tables_config WHERE id = ?', [id]);
  if (!table) {
    return res.status(404).json({ error: 'Mesa no encontrada' });
  }

  if (table.status !== 'occupied') {
    return res.status(400).json({ error: 'La mesa no está ocupada' });
  }

  const startTime = new Date(table.started_at);
  const now = new Date();
  const diffMs = now - startTime;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  // Cobro proporcional (regla de 3 simple): 60 min = price_per_hour.
  // Se redondea a bolivianos enteros (no hay denominaciones < Bs 1 utiles).
  const total = Math.round(diffMinutes * table.price_per_hour / 60);

  if (table.current_session_id) {
    await run(
      'UPDATE table_sessions SET ended_at = now(), duration_minutes = ?, total = ? WHERE id = ?',
      [diffMinutes, total, table.current_session_id]
    );
  }

  await run(
    'UPDATE tables_config SET status = ?, started_at = NULL, current_session_id = NULL WHERE id = ?',
    ['available', id]
  );

  res.json({
    table_id: parseInt(id),
    duration_minutes: diffMinutes,
    total,
    message: `Mesa ${table.name} liberada. Tiempo: ${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m. Total: Bs ${total}`
  });
}));

router.put('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, price_per_hour, price_per_half_hour } = req.body;

  const table = await get('SELECT * FROM tables_config WHERE id = ?', [id]);
  if (!table) {
    return res.status(404).json({ error: 'Mesa no encontrada' });
  }

  // Las tarifas de las mesas se guardan como numeros enteros (sin decimales)
  const updated = await get(
    'UPDATE tables_config SET name = ?, price_per_hour = ?, price_per_half_hour = ? WHERE id = ? RETURNING *',
    [
      name || table.name,
      price_per_hour !== undefined ? Math.round(parseFloat(price_per_hour)) : table.price_per_hour,
      price_per_half_hour !== undefined ? Math.round(parseFloat(price_per_half_hour)) : table.price_per_half_hour,
      id
    ]
  );

  res.json(updated);
}));

router.post('/', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { name, price_per_hour, price_per_half_hour } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Nombre de mesa es requerido' });
  }

  // Las tarifas de las mesas se guardan como numeros enteros (sin decimales)
  const table = await get(
    'INSERT INTO tables_config (name, price_per_hour, price_per_half_hour) VALUES (?, ?, ?) RETURNING *',
    [
      name,
      Math.round(parseFloat(price_per_hour)) || 20,
      Math.round(parseFloat(price_per_half_hour)) || 10
    ]
  );
  res.status(201).json(table);
}));

router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const table = await get('SELECT * FROM tables_config WHERE id = ?', [id]);
  if (!table) {
    return res.status(404).json({ error: 'Mesa no encontrada' });
  }

  if (table.status === 'occupied') {
    return res.status(400).json({ error: 'No se puede eliminar una mesa ocupada' });
  }

  await run('DELETE FROM tables_config WHERE id = ?', [id]);
  res.json({ message: 'Mesa eliminada' });
}));

module.exports = router;
