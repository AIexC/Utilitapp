import React, { useState, useEffect } from 'react';
import { billsAPI, propertiesAPI, metersAPI } from '../api/api';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [properties, setProperties] = useState([]);
  const [meters, setMeters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    meter_id: '',
    reading_id: '',
    bill_date: new Date().toISOString().split('T')[0],
    amount: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [billsRes, propsRes] = await Promise.all([
        billsAPI.getAll(),
        propertiesAPI.getAll()
      ]);
      setBills(billsRes.data);
      setProperties(propsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMeters = async (propertyId) => {
    try {
      const response = await metersAPI.getByProperty(propertyId);
      setMeters(response.data);
    } catch (error) {
      console.error('Error loading meters:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });

      await billsAPI.create(data);
      setShowForm(false);
      setFormData({ meter_id: '', reading_id: '', bill_date: new Date().toISOString().split('T')[0], amount: '', image: null });
      setImagePreview(null);
      loadData();
    } catch (error) {
      alert('Error creating bill: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleVerify = async (id, verified) => {
    try {
      await billsAPI.verify(id, verified);
      loadData();
    } catch (error) {
      alert('Error updating bill: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this bill?')) {
      try {
        await billsAPI.delete(id);
        loadData();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🧾 Bills</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? 'Cancel' : '+ Add Bill'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <select
            onChange={(e) => {
              setFormData({ ...formData, property_id: e.target.value });
              if (e.target.value) loadMeters(e.target.value);
            }}
            style={styles.input}
            required
          >
            <option value="">Select Property *</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={formData.meter_id}
            onChange={(e) => setFormData({ ...formData, meter_id: e.target.value })}
            style={styles.input}
            required
          >
            <option value="">Select Meter *</option>
            {meters.map(m => (
              <option key={m.id} value={m.id}>{m.utility_type} - {m.meter_number}</option>
            ))}
          </select>

          <input
            type="date"
            value={formData.bill_date}
            onChange={(e) => setFormData({ ...formData, bill_date: e.target.value })}
            style={styles.input}
            required
          />

          <input
            type="number"
            step="0.01"
            placeholder="Amount (RON) *"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            style={styles.input}
            required
          />

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={styles.input}
          />

          {imagePreview && (
            <img src={imagePreview} alt="Preview" style={styles.preview} />
          )}

          <button type="submit" style={styles.submitBtn}>Upload Bill</button>
        </form>
      )}

      <div style={styles.grid}>
        {bills.map((bill) => (
          <div key={bill.id} style={styles.card}>
            <h3 style={styles.cardTitle}>{bill.utility_type}</h3>
            <p style={styles.cardText}>📅 {new Date(bill.bill_date).toLocaleDateString()}</p>
            <p style={styles.cardText}>💰 {parseFloat(bill.amount).toFixed(2)} RON</p>
            <p style={styles.cardText}>🏠 {bill.property_name}</p>
            <p style={styles.cardText}>
              {bill.verified ? '✅ Verified' : '⚠️ Not Verified'}
            </p>
            {bill.image_url && (
              <img src={bill.image_url} alt="Bill" style={styles.billImage} />
            )}
            <div style={styles.actions}>
              <button 
                onClick={() => handleVerify(bill.id, !bill.verified)}
                style={bill.verified ? styles.unverifyBtn : styles.verifyBtn}
              >
                {bill.verified ? 'Unverify' : 'Verify'}
              </button>
              <button onClick={() => handleDelete(bill.id)} style={styles.deleteBtn}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {bills.length === 0 && (
        <p style={styles.empty}>No bills yet. Upload one!</p>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '2rem', fontWeight: 'bold', color: '#111827' },
  addBtn: { backgroundColor: '#4F46E5', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' },
  form: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '1rem' },
  preview: { maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '0.375rem' },
  submitBtn: { backgroundColor: '#10B981', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
  card: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB' },
  cardTitle: { fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#111827', textTransform: 'capitalize' },
  cardText: { color: '#6B7280', marginBottom: '0.5rem', fontSize: '0.9rem' },
  billImage: { width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '0.375rem', marginTop: '0.5rem' },
  actions: { display: 'flex', gap: '0.5rem', marginTop: '1rem' },
  verifyBtn: { flex: 1, backgroundColor: '#10B981', color: 'white', padding: '0.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.9rem' },
  unverifyBtn: { flex: 1, backgroundColor: '#F59E0B', color: 'white', padding: '0.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.9rem' },
  deleteBtn: { flex: 1, backgroundColor: '#EF4444', color: 'white', padding: '0.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.9rem' },
  empty: { textAlign: 'center', color: '#9CA3AF', padding: '3rem', fontSize: '1.1rem' }
};

export default Bills;