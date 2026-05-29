import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit, Trash2, X, Package } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', stock: '', image: null });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/products/all');
      setProducts(res.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', price: '', stock: '', image: null });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({ name: product.name, price: product.price.toString(), stock: product.stock.toString(), image: null });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('price', form.price);
    formData.append('stock', form.stock);
    if (form.image) formData.append('image', form.image);

    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage({ type: 'success', text: 'Producto actualizado' });
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage({ type: 'success', text: 'Producto creado' });
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al guardar producto' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleActive = async (product) => {
    try {
      await api.put(`/products/${product.id}`, { active: product.active ? 0 : 1 });
      loadProducts();
      setMessage({ type: 'success', text: product.active ? 'Producto desactivado' : 'Producto activado' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al actualizar producto' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const deleteProduct = async (product) => {
    if (!confirm(`¿Desactivar "${product.name}"?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      loadProducts();
      setMessage({ type: 'success', text: 'Producto desactivado' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar producto' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h2>Gestión de Productos</h2>
          <p>Administra los productos del inventario</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} style={{ opacity: product.active ? 1 : 0.5 }}>
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
                <td>{product.stock}</td>
                <td>
                  <button
                    className={`btn btn-sm ${product.active ? 'btn-success' : 'btn-outline'}`}
                    onClick={() => toggleActive(product)}
                  >
                    {product.active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td>
                  <div className="actions-row">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(product)}>
                      <Edit size={14} />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteProduct(product)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={form.stock}
                  onChange={e => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Imagen</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={e => setForm({ ...form, image: e.target.files[0] })}
                />
                {editing?.image && (
                  <div style={{ marginTop: 8 }}>
                    <img src={editing.image} alt="Preview" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                    <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-light)' }}>Imagen actual</span>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
