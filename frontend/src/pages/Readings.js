import React, { useState, useEffect } from 'react';
import { readingsAPI, metersAPI, propertiesAPI } from '../api/api';

const Readings = () => {
  const [readings, setReadings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [meters, setMeters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    meter_id: '',
    reading_date: new Date().toISOString().split('T')[0],
    value: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [readingsRes, propsRes] = await Promise.all([
        readingsAPI.getAll(),
        propertiesAPI.getAll()
      ]);
      setReadings(readingsRes.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await readingsAPI.create(formData);
      setShowForm(false);
      setFormData({ meter_id: '', reading_date: new Date().toISOString().split('T')[0], value: '', notes: '' });
      loadData();
    } catch (error) {
      alert('Error creating reading: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this reading?')) {
      try {
        await readingsAPI.delete(id);
        loadData();
      } catch (error) {
        alert('Error: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const calculateConsumption = (reading) => {
    if (reading.previous_value) {
      return (parseFloat(reading.value) - parseFloat(reading.previous_value)).toFixed(2);
    }
    return 'N/A';
  };

  const calculateCost = (reading) => {
    if (reading.previous_value && reading.unit_price) {
      const consumption = parseFloat(reading.value) - parseFloat(reading.previous_value);
      const cost = consumption * parseFloat(reading.unit_price);
      return cost.toFixed(2) + ' RON';
    }
    return 'N/A';
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Meter Readings</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? 'Cancel' : '+ Add Reading'}
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
              <option key={m.id} value={m.id}>
                {m.utility_type} - {m.meter_number}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={formData.reading_date}
            onChange={(e) => setFormData({ ...formData, reading_date: e.target.value })}
            style={styles.input}
            required
          />

          <input
            type="number"
            step="0.01"
            placeholder="Reading Value *"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            style={styles.input}
            required
          />

          <textarea
            placeholder="Notes (optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            style={{ ...styles.input, minHeight: '80px' }}
          />

          <button type="submit" style={styles.submitBtn}>Save Reading</button>
        </form>
      )}

      <div style={styles.table}>
        <table style={styles.tableElement}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Property</th>
              <th style={styles.th}>Utility</th>
              <th style={styles.th}>Meter #</th>
              <th style={styles.th}>Reading</th>
              <th style={styles.th}>Consumption</th>
              <th style={styles.th}>Cost</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((reading) => (
              <tr key={reading.id} style={styles.tr}>
                <td style={styles.td}>
                  {new Date(reading.reading_date).toLocaleDateString()}
                </td>
                <td style={styles.td}>{reading.property_name}</td>
                <td style={styles.td}>
                  {reading.utility_type === 'electricity' && '⚡'}
                  {reading.utility_type === 'gas' && '🔥'}
                  {reading.utility_type === 'water' && '💧'}
                  {reading.utility_type === 'heating' && '🌡️'}
                  {' '}{reading.utility_type}
                </td>
                <td style={styles.td}>{reading.meter_number}</td>
                <td style={styles.td}>{parseFloat(reading.value).toFixed(2)}</td>
                <td style={styles.td}>{calculateConsumption(reading)}</td>
                <td style={styles.td}>{calculateCost(reading)}</td>
                <td style={styles.td}>
                  <button 
                    onClick={() => handleDelete(reading.id)} 
                    style={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {readings.length === 0 && (
        <p style={styles.empty}>No readings yet. Add your first meter reading!</p>
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
  submitBtn: { backgroundColor: '#10B981', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' },
  table: { backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'auto' },
  tableElement: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#F3F4F6', borderBottom: '2px solid #E5E7EB' },
  th: { padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.9rem' },
  tr: { borderBottom: '1px solid #E5E7EB' },
  td: { padding: '1rem', color: '#6B7280', fontSize: '0.9rem' },
  deleteBtn: { backgroundColor: '#EF4444', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem' },
  empty: { textAlign: 'center', color: '#9CA3AF', padding: '3rem', fontSize: '1.1rem' }
};

export default Readings;