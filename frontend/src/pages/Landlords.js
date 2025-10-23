import React, { useState, useEffect } from 'react';
import { landlordsAPI } from '../api/api';

const Landlords = () => {
  const [landlords, setLandlords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bank_account: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLandlords();
  }, []);

  const loadLandlords = async () => {
    try {
      const response = await landlordsAPI.getAll();
      setLandlords(response.data);
    } catch (error) {
      console.error('Error loading landlords:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await landlordsAPI.create(formData);
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', bank_account: '' });
      loadLandlords();
    } catch (error) {
      alert('Error creating landlord: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this landlord?')) {
      try {
        await landlordsAPI.delete(id);
        loadLandlords();
      } catch (error) {
        alert('Error deleting landlord: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🏢 Landlords</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? 'Cancel' : '+ Add Landlord'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={styles.input}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Bank Account"
            value={formData.bank_account}
            onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
            style={styles.input}
          />
          <button type="submit" style={styles.submitBtn}>Create Landlord</button>
        </form>
      )}

      <div style={styles.grid}>
        {landlords.map((landlord) => (
          <div key={landlord.id} style={styles.card}>
            <h3 style={styles.cardTitle}>{landlord.name}</h3>
            <p style={styles.cardText}>📧 {landlord.email || 'N/A'}</p>
            <p style={styles.cardText}>📞 {landlord.phone || 'N/A'}</p>
            <p style={styles.cardText}>🏦 {landlord.bank_account || 'N/A'}</p>
            <p style={styles.cardText}>🏠 Properties: {landlord.property_count || 0}</p>
            <button 
              onClick={() => handleDelete(landlord.id)} 
              style={styles.deleteBtn}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {landlords.length === 0 && (
        <p style={styles.empty}>No landlords yet. Click "Add Landlord" to create one!</p>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#111827'
  },
  addBtn: {
    backgroundColor: '#4F46E5',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500'
  },
  form: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    marginBottom: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.375rem',
    fontSize: '1rem'
  },
  submitBtn: {
    backgroundColor: '#10B981',
    color: 'white',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #E5E7EB'
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.75rem',
    color: '#111827'
  },
  cardText: {
    color: '#6B7280',
    marginBottom: '0.5rem',
    fontSize: '0.9rem'
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginTop: '1rem'
  },
  empty: {
    textAlign: 'center',
    color: '#9CA3AF',
    padding: '3rem',
    fontSize: '1.1rem'
  }
};

export default Landlords;