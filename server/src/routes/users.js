const express = require('express');
const bcrypt = require('bcryptjs');
const { all, get, run, asyncHandler } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const users = await all('SELECT id, username, role, created_at FROM users ORDER BY id');
  res.json(users);
}));

router.post('/', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  if (!['admin', 'encargado'].includes(role)) {
    return res.status(400).json({ error: 'Rol debe ser admin o encargado' });
  }

  const existing = await get('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) {
    return res.status(409).json({ error: 'El nombre de usuario ya existe' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const user = await get(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?) RETURNING id, username, role, created_at',
    [username, hashedPassword, role]
  );

  res.status(201).json(user);
}));

router.put('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  const existing = await get('SELECT * FROM users WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  if (username && username !== existing.username) {
    const duplicate = await get('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
    if (duplicate) {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }
  }

  const updates = {
    username: username || existing.username,
    role: role || existing.role,
    password: password ? bcrypt.hashSync(password, 10) : existing.password
  };

  const user = await get(
    'UPDATE users SET username = ?, password = ?, role = ? WHERE id = ? RETURNING id, username, role, created_at',
    [updates.username, updates.password, updates.role, id]
  );
  res.json(user);
}));

router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
  }

  const existing = await get('SELECT * FROM users WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  await run('DELETE FROM users WHERE id = ?', [id]);
  res.json({ message: 'Usuario eliminado' });
}));

module.exports = router;
