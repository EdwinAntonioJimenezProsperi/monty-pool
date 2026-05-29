const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
  }
});

router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const products = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY name').all();
  res.json(products);
});

router.get('/all', authenticateToken, requireAdmin, (req, res) => {
  const db = getDb();
  const products = db.prepare('SELECT * FROM products ORDER BY name').all();
  res.json(products);
});

router.post('/', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  const { name, price, stock } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }

  const db = getDb();
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const result = db.prepare(
    'INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)'
  ).run(name, parseFloat(price), parseInt(stock) || 0, image);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, price, stock, active } = req.body;
  const db = getDb();

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const image = req.file ? `/uploads/${req.file.filename}` : existing.image;

  db.prepare(
    'UPDATE products SET name = ?, price = ?, stock = ?, image = ?, active = ? WHERE id = ?'
  ).run(
    name || existing.name,
    price !== undefined ? parseFloat(price) : existing.price,
    stock !== undefined ? parseInt(stock) : existing.stock,
    image,
    active !== undefined ? parseInt(active) : existing.active,
    id
  );

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json(product);
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(id);
  res.json({ message: 'Producto desactivado' });
});

module.exports = router;
