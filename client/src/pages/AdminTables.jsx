import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price_per_hour: '20', price_per_half_hour: '10' });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', price_per_hour: '20', price_per_half_hour: '10' });
    setShowModal(true);
  };

  const openEdit = (table) => {
    setEditing(table);
    setForm({
      name: table.name,
      price_per_hour: table.price_per_hour.toString(),
      price_per_half_hour: table.price_per_half_hour.toString()
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/tables/${editing.id}`, form);
        setMessage({ type: 'success', text: 'Mesa actualizada' });
      } else {
        await api.post('/tables', form);
        setMessage({ type: 'success', text: 'Mesa creada' });
      }
      setShowModal(false);
      loadTables();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al guardar mesa' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const deleteTable = async (table) => {
    if (!confirm(`¿Eliminar "${table.name}"?`)) return;
    try {
      await api.delete(`/tables/${table.id}`);
      loadTables();
      setMessage({ type: 'success', text: 'Mesa eliminada' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al eliminar mesa' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h2>Configuración de Mesas</h2>
          <p>Administra las mesas y sus tarifas</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Nueva Mesa
        </button>
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mesa</th>
              <th>Precio/Hora</th>
              <th>Precio/Media Hora</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tables.map(table => (
              <tr key={table.id}>
                <td><strong>{table.name}</strong></td>
                <td>Bs {Math.round(table.price_per_hour)}</td>
                <td>Bs {Math.round(table.price_per_half_hour)}</td>
                <td>
                  <span className={`table-status ${table.status}`}>
                    {table.status === 'available' ? 'Disponible' : 'Ocupada'}
                  </span>
                </td>
                <td>
                  <div className="actions-row">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(table)}>
                      <Edit size={14} />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteTable(table)} disabled={table.status === 'occupied'}>
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
              <h3>{editing ? 'Editar Mesa' : 'Nueva Mesa'}</h3>
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
                  placeholder="Ej: Mesa 4"
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio por Hora (Bs)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="form-control"
                  value={form.price_per_hour}
                  onChange={e => setForm({ ...form, price_per_hour: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio por Media Hora (Bs)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="form-control"
                  value={form.price_per_half_hour}
                  onChange={e => setForm({ ...form, price_per_half_hour: e.target.value })}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Guardar Cambios' : 'Crear Mesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
