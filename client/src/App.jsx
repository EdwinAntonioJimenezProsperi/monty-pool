import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import AdminProducts from './pages/AdminProducts';
import AdminTables from './pages/AdminTables';
import AdminUsers from './pages/AdminUsers';
import Reports from './pages/Reports';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="mesas" element={<Tables />} />
        <Route path="ventas" element={<Sales />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="admin/productos" element={<AdminRoute><AdminProducts /></AdminRoute>} />
        <Route path="admin/mesas" element={<AdminRoute><AdminTables /></AdminRoute>} />
        <Route path="admin/usuarios" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="reportes" element={<AdminRoute><Reports /></AdminRoute>} />
      </Route>
    </Routes>
  );
}
