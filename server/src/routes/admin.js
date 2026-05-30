const express = require('express');
const { withTransaction, asyncHandler } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Reiniciar datos de prueba (solo admin):
// borra ventas y sesiones de mesas, y libera todas las mesas.
// No toca usuarios, productos ni la configuración de mesas.
router.post('/reset', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  await withTransaction(async (q) => {
    await q.run('DELETE FROM sales');
    await q.run('DELETE FROM table_sessions');
    await q.run(
      "UPDATE tables_config SET status = 'available', started_at = NULL, current_session_id = NULL"
    );
  });

  res.json({ message: 'Datos de prueba reiniciados: ventas, sesiones e ingresos en cero.' });
}));

module.exports = router;
