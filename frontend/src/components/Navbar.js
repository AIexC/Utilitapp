import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/dashboard" style={styles.brand}>
          🏠 Utilitapp
        </Link>
        
        <div style={styles.menu}>
          <Link to="/dashboard" style={styles.link}>Dashboard</Link>
          <Link to="/landlords" style={styles.link}>Landlords</Link>
          <Link to="/properties" style={styles.link}>Properties</Link>
          <Link to="/rooms" style={styles.link}>Rooms</Link>
          <Link to="/meters" style={styles.link}>Meters</Link>
          <Link to="/readings" style={styles.link}>Readings</Link>
          <Link to="/bills" style={styles.link}>Bills</Link>
          <Link to="/reports" style={styles.link}>Reports</Link>
          {isAdmin && <Link to="/users" style={styles.link}>Users</Link>}
          
          <div style={styles.userInfo}>
            <span style={styles.username}>👤 {user.username}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#4F46E5',
    padding: '1rem 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  brand: {
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none'
  },
  menu: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '0.95rem',
    transition: 'opacity 0.2s'
  },
  userInfo: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginLeft: '1rem',
    paddingLeft: '1rem',
    borderLeft: '1px solid rgba(255,255,255,0.3)'
  },
  username: {
    color: 'white',
    fontSize: '0.9rem'
  },
  logoutBtn: {
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s'
  }
};

export default Navbar;