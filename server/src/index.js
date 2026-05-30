const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./database');
const { seed } = require('./seed');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const tableRoutes = require('./routes/tables');
const salesRoutes = require('./routes/sales');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Serve frontend in production
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

// Initialize database and seed defaults (idempotent)
getDb();
seed();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
