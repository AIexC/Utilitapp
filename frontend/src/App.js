import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Landlords from './pages/Landlords';
import Properties from './pages/Properties';
import Rooms from './pages/Rooms';
import Meters from './pages/Meters';
import Readings from './pages/Readings';
import Bills from './pages/Bills';
import Reports from './pages/Reports';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import TenantDashboard from './pages/TenantDashboard';

// Protected Route wrapper
const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (superAdminOnly && !user.is_super_admin) {
    return <Navigate to="/dashboard" />;
  }

  if (adminOnly && user.role !== 'admin' && !user.is_super_admin) {
    return <Navigate to="/tenant" />;
  }

  return children;
};

// Navigation component
const Navigation = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.navContent}>
        <div style={styles.logo}>
          🏠 Utilitapp
          {user.is_super_admin && <span style={styles.superBadge}>👑 Super Admin</span>}
          {user.role === 'admin' && !user.is_super_admin && <span style={styles.adminBadge}>🔧 Admin</span>}
          {user.role === 'user' && <span style={styles.userBadge}>🏠 Tenant</span>}
        </div>
        
        <div style={styles.navLinks}>
          {(user.role === 'admin' || user.is_super_admin) && (
            <>
              <Link to="/dashboard" style={styles.navLink}>📊 Dashboard</Link>
              <Link to="/landlords" style={styles.navLink}>🏢 Landlords</Link>
              <Link to="/properties" style={styles.navLink}>🏠 Properties</Link>
              <Link to="/rooms" style={styles.navLink}>🚪 Rooms</Link>
              <Link to="/meters" style={styles.navLink}>⚡ Meters</Link>
              <Link to="/readings" style={styles.navLink}>📊 Readings</Link>
              <Link to="/bills" style={styles.navLink}>🧾 Bills</Link>
              <Link to="/reports" style={styles.navLink}>📈 Reports</Link>
              <Link to="/users" style={styles.navLink}>👥 Users</Link>
              {user.is_super_admin && (
                <Link to="/audit-logs" style={styles.navLink}>👑 Audit Logs</Link>
              )}
            </>
          )}

          {user.role === 'user' && !user.is_super_admin && (
            <Link to="/tenant" style={styles.navLink}>🏠 My Dashboard</Link>
          )}
        </div>

        <div style={styles.userInfo}>
          <span style={styles.username}>{user.username}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={styles.app}>
          <Navigation />
          <div style={styles.content}>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute adminOnly>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/landlords" 
                element={
                  <ProtectedRoute adminOnly>
                    <Landlords />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/properties" 
                element={
                  <ProtectedRoute adminOnly>
                    <Properties />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/rooms" 
                element={
                  <ProtectedRoute adminOnly>
                    <Rooms />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/meters" 
                element={
                  <ProtectedRoute adminOnly>
                    <Meters />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/readings" 
                element={
                  <ProtectedRoute>
                    <Readings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/bills" 
                element={
                  <ProtectedRoute adminOnly>
                    <Bills />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute adminOnly>
                    <Reports />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute adminOnly>
                    <Users />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/audit-logs" 
                element={
                  <ProtectedRoute superAdminOnly>
                    <AuditLogs />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/tenant" 
                element={
                  <ProtectedRoute>
                    <TenantDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#F3F4F6'
  },
  nav: {
    backgroundColor: '#4F46E5',
    color: 'white',
    padding: '1rem 0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  navContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  superBadge: {
    fontSize: '0.75rem',
    backgroundColor: '#FBBF24',
    color: '#78350F',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    fontWeight: '600'
  },
  adminBadge: {
    fontSize: '0.75rem',
    backgroundColor: '#34D399',
    color: '#064E3B',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    fontWeight: '600'
  },
  userBadge: {
    fontSize: '0.75rem',
    backgroundColor: '#60A5FA',
    color: '#1E3A8A',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    fontWeight: '600'
  },
  navLinks: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '0.95rem',
    transition: 'opacity 0.2s',
    cursor: 'pointer'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  username: {
    fontSize: '0.95rem',
    fontWeight: '500'
  },
  logoutBtn: {
    backgroundColor: 'white',
    color: '#4F46E5',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem'
  },
  content: {
    minHeight: 'calc(100vh - 80px)'
  }
};

export default App;
