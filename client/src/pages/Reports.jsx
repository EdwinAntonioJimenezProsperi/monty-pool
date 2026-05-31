import { useState, useEffect } from 'react';
import api from '../api';
import { DollarSign, Table2, ShoppingCart, TrendingUp, Trash2 } from 'lucide-react';
import { formatDateTime, formatTime } from '../utils/datetime';

// Fecha local de hoy en formato YYYY-MM-DD (para el selector por día).
function todayLocal() {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

// Convierte un día local (YYYY-MM-DD) al rango ISO [inicio, fin] en UTC,
// para filtrar las sesiones de ese día según la zona horaria del dispositivo.
function dayRange(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [message, setMessage] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [tablesDay, setTablesDay] = useState(todayLocal());
  const [tablesReport, setTablesReport] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTablesReport();
  }, [tablesDay]);

  const loadTablesReport = async () => {
    try {
      const { from, to } = dayRange(tablesDay);
      const res = await api.get('/tables/report', { params: { from, to } });
      setTablesReport(res.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const loadData = async () => {
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const [summaryRes, salesRes] = await Promise.all([
        api.get('/sales/summary', { params }),
        api.get('/sales', { params: { ...params, limit: 50 } })
      ]);
      setSummary(summaryRes.data);
      setSales(salesRes.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleReset = async () => {
    if (!confirm('¿Borrar TODOS los datos de prueba? Se eliminarán las ventas, las sesiones de mesas y los ingresos totales volverán a cero. Los productos, usuarios y la configuración de mesas se mantienen. Esta acción no se puede deshacer.')) return;
    setResetting(true);
    try {
      const res = await api.post('/admin/reset');
      setMessage({ type: 'success', text: res.data.message || 'Datos de prueba reiniciados' });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al reiniciar datos' });
    }
    setResetting(false);
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2>Reportes</h2>
          <p>Resumen de ventas e ingresos</p>
        </div>
        <button className="btn btn-danger" onClick={handleReset} disabled={resetting}>
          <Trash2 size={16} /> {resetting ? 'Borrando...' : 'Borrar datos de prueba'}
        </button>
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleFilter} style={{ display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Desde</label>
            <input type="date" className="form-control" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Hasta</label>
            <input type="date" className="form-control" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">Filtrar</button>
          <button type="button" className="btn btn-outline" onClick={() => { setFrom(''); setTo(''); setTimeout(loadData, 0); }}>Limpiar</button>
        </form>
      </div>

      {summary && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon green">
                <DollarSign size={24} />
              </div>
              <div>
                <div className="stat-value">Bs {summary.grand_total?.toFixed(2)}</div>
                <div className="stat-label">Ingreso Total</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">
                <ShoppingCart size={24} />
              </div>
              <div>
                <div className="stat-value">Bs {summary.product_sales?.total?.toFixed(2)}</div>
                <div className="stat-label">Ventas de Productos ({summary.product_sales?.count})</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow">
                <Table2 size={24} />
              </div>
              <div>
                <div className="stat-value">Bs {summary.table_revenue?.total?.toFixed(2)}</div>
                <div className="stat-label">Ingresos por Mesas ({summary.table_revenue?.sessions})</div>
              </div>
            </div>
          </div>

          {summary.top_products?.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <h3>Productos Más Vendidos</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad Vendida</th>
                    <th>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.top_products.map((p, i) => (
                    <tr key={i}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.total_qty}</td>
                      <td>Bs {p.total_revenue?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <h3>Historial de Mesas por Día</h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input type="date" className="form-control" value={tablesDay} onChange={e => setTablesDay(e.target.value)} />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mesa</th>
              <th>Veces jugada</th>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Total Bs</th>
            </tr>
          </thead>
          <tbody>
            {tablesReport.map(r => (
              <tr key={r.table_id}>
                <td><strong>{r.name}</strong></td>
                <td>{r.plays}</td>
                <td>{r.first_started ? formatTime(r.first_started) : '-'}</td>
                <td>{r.last_ended ? formatTime(r.last_ended) : '-'}</td>
                <td><strong>Bs {r.total}</strong></td>
              </tr>
            ))}
            <tr>
              <td><strong>Total del día</strong></td>
              <td><strong>{tablesReport.reduce((a, r) => a + r.plays, 0)}</strong></td>
              <td>-</td>
              <td>-</td>
              <td><strong>Bs {tablesReport.reduce((a, r) => a + r.total, 0)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Historial de Ventas</h3>
        </div>
        {sales.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>No hay ventas registradas</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
                <th>Mesa</th>
                <th>Vendedor</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id}>
                  <td>{formatDateTime(sale.created_at)}</td>
                  <td>{sale.product_name}</td>
                  <td>{sale.quantity}</td>
                  <td>Bs {sale.unit_price?.toFixed(2)}</td>
                  <td><strong>Bs {sale.total?.toFixed(2)}</strong></td>
                  <td>{sale.table_name || '-'}</td>
                  <td>{sale.sold_by || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
