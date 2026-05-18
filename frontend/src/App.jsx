import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, User as UserIcon, LogOut, Plus } from 'lucide-react';

// API Setup
const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Components
const Navbar = ({ user, onLogout }) => (
  <nav className="navbar">
    <Link to="/" className="navbar-brand">
      <Package className="inline mr-2" /> Global Imports
    </Link>
    <div className="nav-links">
      {user ? (
        <>
          <span className="text-muted mr-4">Hola, {user.name} ({user.role})</span>
          {user.role === 'admin' && (
             <Link to="/admin" className="nav-link">Panel Admin</Link>
          )}
          {user.role === 'user' && (
             <Link to="/dashboard" className="nav-link">Mi Panel</Link>
          )}
          <button onClick={onLogout} className="btn btn-danger ml-4">
            <LogOut size={16} /> Salir
          </button>
        </>
      ) : (
        <Link to="/login" className="btn btn-primary">Iniciar Sesión</Link>
      )}
    </div>
  </nav>
);

const Login = ({ setAuthUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setAuthUser(res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem' }}>Bienvenido de nuevo</h2>
        
        {/* Test Accounts Info */}
        <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}><strong>Cuentas de Prueba:</strong></p>
          <p>Admin: admin@importadora.com / admin123</p>
          <p>Usuario: user@importadora.com / user123</p>
        </div>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [msg, setMsg] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/create-user', { name, email, password, role });
      setMsg({ text: 'Usuario creado exitosamente', type: 'success' });
      setName(''); setEmail(''); setPassword('');
      fetchUsers();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Error al crear usuario', type: 'danger' });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`¿Estás seguro de querer ${currentStatus ? 'suspender' : 'activar'} esta cuenta?`)) return;
    try {
      await api.put(`/auth/users/${id}/status`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = window.prompt('Ingrese la nueva contraseña para este usuario (mínimo 6 caracteres):');
    if (!newPassword) return;
    if (newPassword.length < 6) return alert('La contraseña debe tener al menos 6 caracteres');
    
    try {
      await api.put(`/auth/users/${id}/password`, { newPassword });
      alert('Contraseña actualizada exitosamente');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar contraseña');
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '2rem' }}>Panel de Administración</h1>
      
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <UserIcon color="var(--primary)" />
            <h2>Crear Nuevo Usuario</h2>
          </div>
          
          {msg && (
            <div style={{ color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-darker)', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label className="form-label">Nombre Completo</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Rol del Sistema</label>
              <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                <option value="user">Cliente (Comprador)</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Plus size={16} /> Crear Usuario
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1.5rem' }}>Gestión de Inventario</h2>
          <p style={{ color: 'var(--text-muted)' }}>Módulo de gestión de productos en construcción...</p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>Usuarios Registrados</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Nombre</th>
                <th style={{ padding: '1rem' }}>Correo</th>
                <th style={{ padding: '1rem' }}>Rol</th>
                <th style={{ padding: '1rem' }}>Estado</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>{u.name}</td>
                  <td style={{ padding: '1rem' }}>{u.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      backgroundColor: u.role === 'admin' ? '#e0f2fe' : '#f1f5f9',
                      color: u.role === 'admin' ? '#0284c7' : '#475569',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}>
                      {u.role === 'admin' ? 'Admin' : 'Cliente'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: u.active ? 'var(--success)' : 'var(--danger)', fontWeight: '500' }}>
                      {u.active ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleToggleStatus(u.id, u.active)}
                      className="btn" 
                      style={{ 
                        padding: '0.3rem 0.8rem', 
                        fontSize: '0.85rem',
                        backgroundColor: u.active ? '#fee2e2' : '#dcfce7',
                        color: u.active ? '#b91c1c' : '#15803d',
                        border: '1px solid transparent'
                      }}
                    >
                      {u.active ? 'Suspender' : 'Activar'}
                    </button>
                    <button 
                      onClick={() => handleResetPassword(u.id)}
                      className="btn" 
                      style={{ 
                        padding: '0.3rem 0.8rem', 
                        fontSize: '0.85rem',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      Renovar Clave
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const UserDashboard = () => (
  <div className="animate-fade-in">
    <h1 style={{ marginBottom: '2rem' }}>Mi Portal</h1>
    <div className="card">
      <h2>Catálogo de Productos</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Aquí podrás explorar y comprar los productos importados. (Módulo en construcción...)</p>
    </div>
  </div>
);

// Main App Component
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic auto-login logic if token exists
    const token = localStorage.getItem('token');
    if (token) {
      // Decode JWT roughly to get user info (in production use a /me endpoint)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // We need name and email ideally, but we'll mock it for now until a real fetch
        setUser({ id: payload.userId, role: payload.role, name: 'Usuario' });
      } catch (e) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <Router>
      <div className="app-container">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login setAuthUser={setUser} />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={user?.role === 'user' ? <UserDashboard /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
