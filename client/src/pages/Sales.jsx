import { useState, useEffect } from 'react';
import api from '../api';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [message, setMessage] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, tablesRes] = await Promise.all([
        api.get('/products'),
        api.get('/tables')
      ]);
      setProducts(productsRes.data);
      setTables(tablesRes.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setMessage({ type: 'warning', text: `Stock máximo: ${product.stock}` });
          setTimeout(() => setMessage(null), 2000);
          return prev;
        }
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      if (product.stock < 1) {
        setMessage({ type: 'warning', text: 'Producto sin stock' });
        setTimeout(() => setMessage(null), 2000);
        return prev;
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        max_stock: product.stock
      }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product_id === productId) {
          const newQty = item.quantity + delta;
          if (newQty < 1 || newQty > item.max_stock) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const processSale = async () => {
    if (cart.length === 0) return;
    setProcessing(true);

    try {
      for (const item of cart) {
        await api.post('/sales', {
          product_id: item.product_id,
          quantity: item.quantity,
          table_id: selectedTable || null
        });
      }
      setMessage({ type: 'success', text: `Venta registrada: $${cartTotal.toFixed(2)}` });
      setCart([]);
      setSelectedTable('');
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al procesar venta' });
    } finally {
      setProcessing(false);
    }
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Punto de Venta</h2>
        <p>Selecciona productos para vender</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="sell-panel">
        <div>
          <div className="products-grid">
            {products.map(product => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => addToCart(product)}
                style={{ cursor: 'pointer' }}
              >
                <div className="product-image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    '📦'
                  )}
                </div>
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <div className="price">${product.price.toFixed(2)}</div>
                  <div className={`stock ${product.stock <= 5 ? 'low' : ''}`}>
                    Stock: {product.stock}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sell-cart">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={20} /> Carrito
          </h3>

          <div className="form-group">
            <label>Mesa (opcional)</label>
            <select
              className="form-control"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
            >
              <option value="">Sin mesa</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {cart.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🛒</div>
              <p>Haz clic en un producto para agregarlo</p>
            </div>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.product_id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="name">{item.name}</div>
                    <div className="price">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                  <div className="quantity-control">
                    <button onClick={() => updateQuantity(item.product_id, -1)}>
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product_id, 1)}>
                      <Plus size={14} />
                    </button>
                    <button onClick={() => removeFromCart(item.product_id)} style={{ color: 'var(--danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="cart-total">
                <span>Total:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>

              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={processSale}
                disabled={processing}
                style={{ marginTop: 12 }}
              >
                {processing ? 'Procesando...' : `Cobrar $${cartTotal.toFixed(2)}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
