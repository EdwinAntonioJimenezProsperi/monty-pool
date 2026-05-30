const express = require('express');
const { getDb } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Reiniciar datos de prueba (solo admin):
// borra ventas y sesiones de mesas, y libera todas las mesas.
// No toca usuarios, productos ni la configuración de mesas.
router.post('/reset', authenticateToken, requireAdmin, (req, res) => {
  const db = getDb();

  db.transaction(() => {
    db.prepare('DELETE FROM sales').run();
    db.prepare('DELETE FROM table_sessions').run();
    db.prepare(
      "UPDATE tables_config SET status = 'available', started_at = NULL, current_session_id = NULL"
    ).run();
  })();

  res.json({ message: 'Datos de prueba reiniciados: ventas, sesiones e ingresos en cero.' });
});

module.exports = router;
