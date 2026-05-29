import { useState, useEffect } from 'react';
import api from '../api';
import { Package } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Inventario</h2>
        <p>Vista actual del inventario de productos</p>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>
                  {product.image ? (
                    <img src={product.image} alt={product.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={20} color="#9ca3af" />
                    </div>
                  )}
                </td>
                <td><strong>{product.name}</strong></td>
                <td>${product.price.toFixed(2)}</td>
                <td>
                  <span className={product.stock <= 5 ? 'stock low' : ''}>
                    {product.stock} unidades
                  </span>
                </td>
                <td>
                  {product.stock === 0 ? (
                    <span className="badge" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>Agotado</span>
                  ) : product.stock <= 5 ? (
                    <span className="badge" style={{ background: 'var(--warning-light)', color: '#92400e' }}>Bajo</span>
                  ) : (
                    <span className="badge" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
