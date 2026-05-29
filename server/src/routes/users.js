const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY id').all();
  res.json(users);
});

router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  if (!['admin', 'encargado'].includes(role)) {
    return res.status(400).json({ error: 'Rol debe ser admin o encargado' });
  }

  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'El nombre de usuario ya existe' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const result = db.prepare(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
  ).run(username, hashedPassword, role);

  const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json(user);
});

router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;
  const db = getDb();

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  if (username && username !== existing.username) {
    const duplicate = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, id);
    if (duplicate) {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }
  }

  const updates = {
    username: username || existing.username,
    role: role || existing.role,
    password: password ? bcrypt.hashSync(password, 10) : existing.password
  };

  db.prepare('UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?')
    .run(updates.username, updates.password, updates.role, id);

  const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id);
  res.json(user);
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'Usuario eliminado' });
});

module.exports = router;
