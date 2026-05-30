import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Package, Table2, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [tablesRes, productsRes, summaryRes] = await Promise.all([
        api.get('/tables'),
        api.get('/products'),
        api.get('/sales/summary')
      ]);
      setTables(tablesRes.data);
      setProducts(productsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  };

  const occupiedTables = tables.filter(t => t.status === 'occupied');
  const lowStockProducts = products.filter(p => p.stock <= 5);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Bienvenido, {user?.username}. Resumen del negocio.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-value">Bs {summary?.grand_total?.toFixed(2) || '0.00'}</div>
            <div className="stat-label">Ingresos Totales</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Table2 size={24} />
          </div>
          <div>
            <div className="stat-value">{occupiedTables.length}/{tables.length}</div>
            <div className="stat-label">Mesas Ocupadas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <Package size={24} />
          </div>
          <div>
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Productos Activos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-value">{summary?.product_sales?.count || 0}</div>
            <div className="stat-label">Ventas Realizadas</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3>Estado de Mesas</h3>
          </div>
          {tables.map(table => (
            <div key={table.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: '1px solid var(--border)'
            }}>
              <div>
                <strong>{table.name}</strong>
                {table.status === 'occupied' && (
                  <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-light)' }}>
                    {table.elapsed_display}
                  </span>
                )}
              </div>
              <span className={`table-status ${table.status}`}>
                {table.status === 'available' ? 'Disponible' : 'Ocupada'}
              </span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Productos con Bajo Stock</h3>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="empty-state">
              <p>Todos los productos tienen stock suficiente</p>
            </div>
          ) : (
            lowStockProducts.map(product => (
              <div key={product.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid var(--border)'
              }}>
                <strong>{product.name}</strong>
                <span className="stock low">Stock: {product.stock}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
