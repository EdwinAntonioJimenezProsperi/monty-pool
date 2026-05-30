const bcrypt = require('bcryptjs');
const { getDb } = require('./database');

function seed() {
  const db = getDb();

  // Create admin user
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'admin');
    console.log('Usuario admin creado (usuario: admin, contraseña: admin123)');
  }

  // Create encargado user
  const encargadoExists = db.prepare('SELECT id FROM users WHERE username = ?').get('encargado');
  if (!encargadoExists) {
    const hashedPassword = bcrypt.hashSync('encargado123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('encargado', hashedPassword, 'encargado');
    console.log('Usuario encargado creado (usuario: encargado, contraseña: encargado123)');
  }

  // Create 3 tables
  const tableCount = db.prepare('SELECT COUNT(*) as count FROM tables_config').get().count;
  if (tableCount === 0) {
    for (let i = 1; i <= 3; i++) {
      db.prepare('INSERT INTO tables_config (name, price_per_hour, price_per_half_hour) VALUES (?, ?, ?)').run(`Mesa ${i}`, 20, 10);
    }
    console.log('3 mesas creadas con tarifas: Bs 20/hora, Bs 10/media hora');
  }

  // Create sample products
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount === 0) {
    const products = [
      { name: 'Cerveza', price: 25, stock: 50 },
      { name: 'Coca Cola', price: 15, stock: 40 },
      { name: 'Agua', price: 10, stock: 60 },
      { name: 'Papas', price: 20, stock: 30 },
      { name: 'Cacahuates', price: 15, stock: 25 }
    ];

    for (const p of products) {
      db.prepare('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)').run(p.name, p.price, p.stock);
    }
    console.log(`${products.length} productos de ejemplo creados`);
  }

  console.log('Seed completado exitosamente');
}

seed();
