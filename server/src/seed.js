const bcrypt = require('bcryptjs');
const { init, get, run } = require('./database');

async function seed() {
  await init();

  // Create admin user
  const adminExists = await get('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin']);
    console.log('Usuario admin creado (usuario: admin, contraseña: admin123)');
  }

  // Create encargado user
  const encargadoExists = await get('SELECT id FROM users WHERE username = ?', ['encargado']);
  if (!encargadoExists) {
    const hashedPassword = bcrypt.hashSync('encargado123', 10);
    await run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['encargado', hashedPassword, 'encargado']);
    console.log('Usuario encargado creado (usuario: encargado, contraseña: encargado123)');
  }

  // Create 3 tables
  const tableCountRow = await get('SELECT COUNT(*) as count FROM tables_config');
  if (Number(tableCountRow.count) === 0) {
    for (let i = 1; i <= 3; i++) {
      await run('INSERT INTO tables_config (name, price_per_hour, price_per_half_hour) VALUES (?, ?, ?)', [`Mesa ${i}`, 20, 10]);
    }
    console.log('3 mesas creadas con tarifas: Bs 20/hora, Bs 10/media hora');
  }

  // Create sample products
  const productCountRow = await get('SELECT COUNT(*) as count FROM products');
  if (Number(productCountRow.count) === 0) {
    const products = [
      { name: 'Cerveza', price: 25, stock: 50 },
      { name: 'Coca Cola', price: 15, stock: 40 },
      { name: 'Agua', price: 10, stock: 60 },
      { name: 'Papas', price: 20, stock: 30 },
      { name: 'Cacahuates', price: 15, stock: 25 }
    ];

    for (const p of products) {
      await run('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)', [p.name, p.price, p.stock]);
    }
    console.log(`${products.length} productos de ejemplo creados`);
  }

  console.log('Seed completado exitosamente');
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en seed:', err);
      process.exit(1);
    });
}
