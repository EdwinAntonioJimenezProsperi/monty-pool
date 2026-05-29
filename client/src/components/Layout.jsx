import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Table2, ShoppingCart, Package,
  Settings, Users, BarChart3, LogOut, CircleDot
} from 'lucide-react';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>🎱 Billar</h1>
          <div className="subtitle">Sistema de Gestión</div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </NavLink>
          <NavLink to="/mesas" className={({ isActive }) => isActive ? 'active' : ''}>
            <Table2 size={20} /> <span>Mesas</span>
          </NavLink>
          <NavLink to="/ventas" className={({ isActive }) => isActive ? 'active' : ''}>
            <ShoppingCart size={20} /> <span>Ventas</span>
          </NavLink>
          <NavLink to="/inventario" className={({ isActive }) => isActive ? 'active' : ''}>
            <Package size={20} /> <span>Inventario</span>
          </NavLink>

          {isAdmin && (
            <>
              <div style={{ padding: '12px 20px', fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>
                Administración
              </div>
              <NavLink to="/admin/productos" className={({ isActive }) => isActive ? 'active' : ''}>
                <CircleDot size={20} /> <span>Productos</span>
              </NavLink>
              <NavLink to="/admin/mesas" className={({ isActive }) => isActive ? 'active' : ''}>
                <Settings size={20} /> <span>Config. Mesas</span>
              </NavLink>
              <NavLink to="/admin/usuarios" className={({ isActive }) => isActive ? 'active' : ''}>
                <Users size={20} /> <span>Usuarios</span>
              </NavLink>
              <NavLink to="/reportes" className={({ isActive }) => isActive ? 'active' : ''}>
                <BarChart3 size={20} /> <span>Reportes</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="name">{user?.username}</div>
              <div className="role">{user?.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={16} /> <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
