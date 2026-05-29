import { useState, useEffect } from 'react';
import api from '../api';
import { DollarSign, Table2, ShoppingCart, TrendingUp } from 'lucide-react';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    loadData();
  }, []);

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

  return (
    <div>
      <div className="page-header">
        <h2>Reportes</h2>
        <p>Resumen de ventas e ingresos</p>
      </div>

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
                <div className="stat-value">${summary.grand_total?.toFixed(2)}</div>
                <div className="stat-label">Ingreso Total</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">
                <ShoppingCart size={24} />
              </div>
              <div>
                <div className="stat-value">${summary.product_sales?.total?.toFixed(2)}</div>
                <div className="stat-label">Ventas de Productos ({summary.product_sales?.count})</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow">
                <Table2 size={24} />
              </div>
              <div>
                <div className="stat-value">${summary.table_revenue?.total?.toFixed(2)}</div>
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
                      <td>${p.total_revenue?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

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
                  <td>{new Date(sale.created_at).toLocaleString('es-MX')}</td>
                  <td>{sale.product_name}</td>
                  <td>{sale.quantity}</td>
                  <td>${sale.unit_price?.toFixed(2)}</td>
                  <td><strong>${sale.total?.toFixed(2)}</strong></td>
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
