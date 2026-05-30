import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { formatDate } from '../utils/datetime';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'encargado' });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ username: '', password: '', role: 'encargado' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ username: user.username, password: '', role: user.role });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (editing && !data.password) delete data.password;

      if (editing) {
        await api.put(`/users/${editing.id}`, data);
        setMessage({ type: 'success', text: 'Usuario actualizado' });
      } else {
        await api.post('/users', data);
        setMessage({ type: 'success', text: 'Usuario creado' });
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al guardar usuario' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const deleteUser = async (user) => {
    if (!confirm(`¿Eliminar usuario "${user.username}"?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      loadUsers();
      setMessage({ type: 'success', text: 'Usuario eliminado' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al eliminar usuario' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h2>Gestión de Usuarios</h2>
          <p>Administra los usuarios del sistema</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td><strong>{user.username}</strong></td>
                <td>
                  <span className={`badge badge-${user.role}`}>
                    {user.role === 'admin' ? 'Administrador' : 'Encargado'}
                  </span>
                </td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <div className="actions-row">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(user)}>
                      <Edit size={14} />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteUser(user)}>
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
              <h3>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre de Usuario</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{editing ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required={!editing}
                />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select
                  className="form-control"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="encargado">Encargado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
