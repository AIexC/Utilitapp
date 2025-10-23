import React, { useState, useEffect } from 'react';
import { propertiesAPI, landlordsAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [landlords, setLandlords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    landlord_id: ''
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [propsRes, landlordsRes] = await Promise.all([
        propertiesAPI.getAll(),
        landlordsAPI.getAll()
      ]);
      setProperties(propsRes.data);
      setLandlords(landlordsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await propertiesAPI.create(formData);
      setShowForm(false);
      setFormData({ name: '', address: '', landlord_id: '' });
      loadData();
    } catch (error) {
      alert('Error creating property: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure? This will delete all rooms, meters, readings, and bills!')) {
      try {
        await propertiesAPI.delete(id);
        loadData();
      } catch (error) {
        alert('Error deleting property: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🏠 Properties</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? 'Cancel' : '+ Add Property'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Property Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={styles.input}
            required
          />
          <input
            type="text"
            placeholder="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            style={styles.input}
          />
          <select
            value={formData.landlord_id}
            onChange={(e) => setFormData({ ...formData, landlord_id: e.target.value })}
            style={styles.input}
            required
          >
            <option value="">Select Landlord *</option>
            {landlords.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <button type="submit" style={styles.submitBtn}>Create Property</button>
        </form>
      )}

      <div style={styles.grid}>
        {properties.map((property) => (
          <div key={property.id} style={styles.card}>
            <h3 style={styles.cardTitle}>{property.name}</h3>
            <p style={styles.cardText}>📍 {property.address || 'No address'}</p>
            <p style={styles.cardText}>🏢 {property.landlord_name}</p>
            <p style={styles.cardText}>🚪 Rooms: {property.room_count || 0}</p>
            <p style={styles.cardText}>⚡ Meters: {property.meter_count || 0}</p>
            <div style={styles.actions}>
              <button 
                onClick={() => navigate(`/rooms?property=${property.id}`)} 
                style={styles.viewBtn}
              >
                Manage Rooms
              </button>
              <button 
                onClick={() => handleDelete(property.id)} 
                style={styles.deleteBtn}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {properties.length === 0 && (
        <p style={styles.empty}>No properties yet. Add one to get started!</p>
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
  actions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem'
  },
  viewBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    color: 'white',
    padding: '0.5rem',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    color: 'white',
    padding: '0.5rem',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  empty: {
    textAlign: 'center',
    color: '#9CA3AF',
    padding: '3rem',
    fontSize: '1.1rem'
  }
};

export default Properties;