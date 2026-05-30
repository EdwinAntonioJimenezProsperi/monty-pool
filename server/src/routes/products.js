const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { all, get, run, asyncHandler } = require('../database');
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

router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const products = await all('SELECT * FROM products WHERE active = 1 ORDER BY name');
  res.json(products);
}));

router.get('/all', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const products = await all('SELECT * FROM products ORDER BY name');
  res.json(products);
}));

router.post('/', authenticateToken, requireAdmin, upload.single('image'), asyncHandler(async (req, res) => {
  const { name, price, stock } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }

  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const product = await get(
    'INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?) RETURNING *',
    [name, parseFloat(price), parseInt(stock) || 0, image]
  );
  res.status(201).json(product);
}));

router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, price, stock, active } = req.body;

  const existing = await get('SELECT * FROM products WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const image = req.file ? `/uploads/${req.file.filename}` : existing.image;

  const product = await get(
    'UPDATE products SET name = ?, price = ?, stock = ?, image = ?, active = ? WHERE id = ? RETURNING *',
    [
      name || existing.name,
      price !== undefined ? parseFloat(price) : existing.price,
      stock !== undefined ? parseInt(stock) : existing.stock,
      image,
      active !== undefined ? parseInt(active) : existing.active,
      id
    ]
  );
  res.json(product);
}));

router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await run('UPDATE products SET active = 0 WHERE id = ?', [id]);
  res.json({ message: 'Producto desactivado' });
}));

module.exports = router;
