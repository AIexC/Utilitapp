import React, { useState, useEffect } from 'react';
import { metersAPI, propertiesAPI, roomsAPI } from '../api/api';

const Meters = () => {
  const [meters, setMeters] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMeter, setEditingMeter] = useState(null);
  const [formData, setFormData] = useState({
    property_id: '',
    room_id: '',
    utility_type: 'electricity',
    meter_number: '',
    split_method: 'area',
    unit_price: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await propertiesAPI.getAll();
      setProperties(response.data);
      
      // Load all meters
      const allMeters = [];
      for (const prop of response.data) {
        const metersRes = await metersAPI.getByProperty(prop.id);
        allMeters.push(...metersRes.data);
      }
      setMeters(allMeters);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async (propertyId) => {
    try {
      const response = await roomsAPI.getByProperty(propertyId);
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const handleEdit = (meter) => {
    setEditingMeter(meter);
    setFormData({
      property_id: meter.property_id || '',
      room_id: meter.room_id || '',
      utility_type: meter.utility_type,
      meter_number: meter.meter_number,
      split_method: meter.split_method || 'area',
      unit_price: meter.unit_price || ''
    });
    if (meter.property_id) loadRooms(meter.property_id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingMeter(null);
    setShowForm(false);
    setFormData({ property_id: '', room_id: '', utility_type: 'electricity', meter_number: '', split_method: 'area', unit_price: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMeter) {
        // Update existing meter
        await metersAPI.update(editingMeter.id, {
          meter_number: formData.meter_number,
          split_method: formData.split_method,
          unit_price: formData.unit_price || null,
          room_id: formData.room_id || null
        });
      } else {
        // Create new meter
        await metersAPI.create(formData);
      }
      handleCancelEdit();
      loadData();
    } catch (error) {
      alert(`Error ${editingMeter ? 'updating' : 'creating'} meter: ` + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this meter? This will delete all readings and bills!')) {
      try {
        await metersAPI.delete(id);
        loadData();
      } catch (error) {
        alert('Error: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>⚡ Meters</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={styles.addBtn}>
            + Add Meter
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={{ margin: 0, marginBottom: '1rem', color: '#111827' }}>
            {editingMeter ? '✏️ Edit Meter' : '➕ Add New Meter'}
          </h3>

          {!editingMeter && (
            <>
              <select
                value={formData.property_id}
                onChange={(e) => {
                  setFormData({ ...formData, property_id: e.target.value });
                  if (e.target.value) loadRooms(e.target.value);
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
                value={formData.utility_type}
                onChange={(e) => setFormData({ ...formData, utility_type: e.target.value })}
                style={styles.input}
                required
              >
                <option value="electricity">⚡ Electricity</option>
                <option value="gas">🔥 Gas</option>
                <option value="water">💧 Water</option>
                <option value="heating">🌡️ Heating</option>
              </select>
            </>
          )}

          <input
            type="text"
            placeholder="Meter Number *"
            value={formData.meter_number}
            onChange={(e) => setFormData({ ...formData, meter_number: e.target.value })}
            style={styles.input}
            required
          />

          <select
            value={formData.split_method}
            onChange={(e) => setFormData({ ...formData, split_method: e.target.value })}
            style={styles.input}
          >
            <option value="area">📏 Split by Area (m²)</option>
            <option value="equal">⚖️ Split Equally</option>
            <option value="custom">🎯 Custom Split</option>
            <option value="individual">🚪 Individual (per room)</option>
          </select>

          {formData.split_method === 'individual' && (
            <select
              value={formData.room_id}
              onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
              style={styles.input}
            >
              <option value="">Select Room (Optional)</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name} - {r.square_meters}m²</option>
              ))}
            </select>
          )}

          <input
            type="number"
            step="0.0001"
            placeholder="Unit Price (RON) - Optional"
            value={formData.unit_price}
            onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
            style={styles.input}
          />

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" style={styles.submitBtn}>
              {editingMeter ? '💾 Update Meter' : '✅ Create Meter'}
            </button>
            <button type="button" onClick={handleCancelEdit} style={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={styles.grid}>
        {meters.map((meter) => (
          <div key={meter.id} style={styles.card}>
            <h3 style={styles.cardTitle}>
              {meter.utility_type === 'electricity' && '⚡'}
              {meter.utility_type === 'gas' && '🔥'}
              {meter.utility_type === 'water' && '💧'}
              {meter.utility_type === 'heating' && '🌡️'}
              {' '}{meter.utility_type}
            </h3>
            <p style={styles.cardText}>🔢 {meter.meter_number}</p>
            <p style={styles.cardText}>🏠 {meter.property_name}</p>
            {meter.room_name && (
              <p style={styles.cardText}>🚪 Room: {meter.room_name}</p>
            )}
            <p style={styles.cardText}>
              📊 Split: {meter.split_method === 'area' ? '📏 By Area' : 
                        meter.split_method === 'equal' ? '⚖️ Equal' : 
                        meter.split_method === 'individual' ? '🚪 Individual' : '🎯 Custom'}
            </p>
            {meter.unit_price && (
              <p style={styles.cardText}>💰 {parseFloat(meter.unit_price).toFixed(4)} RON/unit</p>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={() => handleEdit(meter)} style={styles.editBtn}>
                ✏️ Edit
              </button>
              <button onClick={() => handleDelete(meter.id)} style={styles.deleteBtn}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {meters.length === 0 && (
        <p style={styles.empty}>No meters yet. Add your first meter!</p>
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
  submitBtn: { backgroundColor: '#10B981', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500', flex: 1 },
  cancelBtn: { backgroundColor: '#6B7280', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500', flex: 1 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
  card: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB' },
  cardTitle: { fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#111827', textTransform: 'capitalize' },
  cardText: { color: '#6B7280', marginBottom: '0.5rem', fontSize: '0.9rem' },
  editBtn: { backgroundColor: '#3B82F6', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.9rem', flex: 1 },
  deleteBtn: { backgroundColor: '#EF4444', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.9rem', flex: 1 },
  empty: { textAlign: 'center', color: '#9CA3AF', padding: '3rem', fontSize: '1.1rem' }
};

export default Meters;