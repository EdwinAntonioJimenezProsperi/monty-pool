import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Play, Square, Clock, DollarSign } from 'lucide-react';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    loadTables();
    timerRef.current = setInterval(loadTables, 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const loadTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const startTable = async (id) => {
    try {
      await api.post(`/tables/${id}/start`);
      setMessage({ type: 'success', text: 'Mesa iniciada correctamente' });
      loadTables();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al iniciar mesa' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const stopTable = async (id) => {
    if (!confirm('¿Deseas liberar esta mesa y cobrar el tiempo?')) return;
    try {
      const res = await api.post(`/tables/${id}/stop`);
      setMessage({ type: 'success', text: res.data.message });
      loadTables();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al detener mesa' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Control de Mesas</h2>
        <p>Gestiona el tiempo de juego en cada mesa</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="tables-grid">
        {tables.map(table => (
          <div key={table.id} className={`table-card ${table.status}`}>
            <div className="table-card-header">
              <h3>{table.name}</h3>
              <span className={`table-status ${table.status}`}>
                {table.status === 'available' ? 'Disponible' : 'Ocupada'}
              </span>
            </div>

            <div className="table-rates">
              <span><Clock size={14} /> Bs {table.price_per_hour}/hora</span>
              <span><DollarSign size={14} /> Bs {table.price_per_half_hour}/media hora</span>
            </div>

            <div className="table-time">
              <div className="time">{table.elapsed_display || '0h 0m'}</div>
              {table.status === 'occupied' && (
                <div className="cost">Acumulado: Bs {table.estimated_total?.toFixed(2)}</div>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              {table.status === 'available' ? (
                <button className="btn btn-success btn-block btn-lg" onClick={() => startTable(table.id)}>
                  <Play size={18} /> Iniciar Mesa
                </button>
              ) : (
                <button className="btn btn-danger btn-block btn-lg" onClick={() => stopTable(table.id)}>
                  <Square size={18} /> Detener y Cobrar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
