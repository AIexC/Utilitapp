import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showPropertyAccess, setShowPropertyAccess] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [usersRes, propsRes] = await Promise.all([
        axios.get(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/properties`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setUsers(usersRes.data);
      setProperties(propsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/users`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowForm(false);
      setFormData({ username: '', email: '', password: '', role: 'user' });
      loadData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/users/${id}`, 
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/users/${id}/reset-password`, 
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Password reset successfully');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone!')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const loadPropertyAccess = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/users/${userId}/property-access`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowPropertyAccess({ userId, properties: response.data });
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleGrantAccess = async (userId, propertyId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/users/${userId}/property-access`, 
        { propertyId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadPropertyAccess(userId);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRevokeAccess = async (userId, propertyId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/users/${userId}/property-access/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadPropertyAccess(userId);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>👥 Users Management</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={styles.addBtn}>
            + Add User
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={{ margin: 0, marginBottom: '1rem', color: '#111827' }}>
            ➕ Create New User
          </h3>
          
          <input
            type="text"
            placeholder="Username *"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            style={styles.input}
            required
          />
          <input
            type="email"
            placeholder="Email *"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password * (min 6 characters)"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={styles.input}
            required
            minLength={6}
          />
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            style={styles.input}
          >
            <option value="user">User (Tenant)</option>
            <option value="admin">Admin</option>
          </select>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" style={styles.submitBtn}>
              ✅ Create User
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShowForm(false);
                setFormData({ username: '', email: '', password: '', role: 'user' });
              }} 
              style={styles.cancelBtn}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showPropertyAccess && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>
              🏠 Property Access for User #{showPropertyAccess.userId}
            </h3>
            
            <div style={styles.accessList}>
              <h4>Current Access:</h4>
              {showPropertyAccess.properties.length === 0 ? (
                <p style={{ color: '#9CA3AF' }}>No property access granted yet</p>
              ) : (
                showPropertyAccess.properties.map(prop => (
                  <div key={prop.property_id} style={styles.accessItem}>
                    <span>{prop.property_name}</span>
                    <button 
                      onClick={() => handleRevokeAccess(showPropertyAccess.userId, prop.property_id)}
                      style={styles.revokeBtn}
                    >
                      🗑️ Revoke
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={styles.accessList}>
              <h4>Grant Access to Property:</h4>
              {properties.filter(p => 
                !showPropertyAccess.properties.some(ap => ap.property_id === p.id)
              ).map(prop => (
                <div key={prop.id} style={styles.accessItem}>
                  <span>{prop.name}</span>
                  <button 
                    onClick={() => handleGrantAccess(showPropertyAccess.userId, prop.id)}
                    style={styles.grantBtn}
                  >
                    ✅ Grant
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowPropertyAccess(null)} 
              style={styles.closeBtn}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        {users.map((user) => (
          <div key={user.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>
                {user.is_super_admin && '👑 '}
                {user.role === 'admin' && !user.is_super_admin && '🔧 '}
                {user.role === 'user' && '🏠 '}
                {user.username}
              </h3>
              <span style={{
                ...styles.badge,
                backgroundColor: user.is_active ? '#10B981' : '#EF4444'
              }}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <p style={styles.cardText}>📧 {user.email}</p>
            <p style={styles.cardText}>
              🔐 Role: {user.is_super_admin ? 'Super Admin' : user.role}
            </p>
            <p style={styles.cardText}>
              📅 Created: {new Date(user.created_at).toLocaleDateString()}
            </p>

            <div style={styles.actions}>
              <button 
                onClick={() => handleToggleActive(user.id, user.is_active)}
                style={user.is_active ? styles.deactivateBtn : styles.activateBtn}
              >
                {user.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
              </button>
              
              <button 
                onClick={() => handleResetPassword(user.id)}
                style={styles.resetBtn}
              >
                🔑 Reset Password
              </button>

              {user.role === 'user' && (
                <button 
                  onClick={() => loadPropertyAccess(user.id)}
                  style={styles.accessBtn}
                >
                  🏠 Manage Access
                </button>
              )}
              
              <button 
                onClick={() => handleDelete(user.id)}
                style={styles.deleteBtn}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <p style={styles.empty}>No users yet. Create your first user!</p>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '2rem', fontWeight: 'bold', color: '#111827' },
  addBtn: { backgroundColor: '#4F46E5', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' },
  form: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '1rem' },
  submitBtn: { backgroundColor: '#10B981', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500', flex: 1 },
  cancelBtn: { backgroundColor: '#6B7280', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500', flex: 1 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' },
  card: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  cardTitle: { fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 },
  badge: { fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', color: 'white', fontWeight: '500' },
  cardText: { color: '#6B7280', marginBottom: '0.5rem', fontSize: '0.9rem' },
  actions: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' },
  deactivateBtn: { flex: '1 1 45%', backgroundColor: '#F59E0B', color: 'white', padding: '0.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem' },
  activateBtn: { flex: '1 1 45%', backgroundColor: '#10B981', color: 'white', padding: '0.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem' },
  resetBtn: { flex: '1 1 45%', backgroundColor: '#3B82F6', color: 'white', padding: '0.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem' },
  accessBtn: { flex: '1 1 45%', backgroundColor: '#8B5CF6', color: 'white', padding: '0.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem' },
  deleteBtn: { flex: '1 1 45%', backgroundColor: '#EF4444', color: 'white', padding: '0.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem' },
  empty: { textAlign: 'center', color: '#9CA3AF', padding: '3rem', fontSize: '1.1rem' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' },
  modalTitle: { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827' },
  accessList: { marginBottom: '1.5rem' },
  accessItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.375rem', marginBottom: '0.5rem' },
  grantBtn: { backgroundColor: '#10B981', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem' },
  revokeBtn: { backgroundColor: '#EF4444', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem' },
  closeBtn: { backgroundColor: '#6B7280', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', width: '100%' }
};

export default Users;
