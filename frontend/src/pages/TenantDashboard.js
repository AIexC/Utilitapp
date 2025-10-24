import React, { useState, useEffect } from 'react';
import { readingsAPI, metersAPI } from '../api/api';
import axios from 'axios';
import API_URL from '../config';

const TenantDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [meters, setMeters] = useState([]);
  const [readings, setReadings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    meter_id: '',
    reading_date: new Date().toISOString().split('T')[0],
    value: '',
    notes: ''
  });
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      loadMetersAndReadings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperty]);

  const loadProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProperties(response.data);
      if (response.data.length > 0) {
        setSelectedProperty(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadMetersAndReadings = async () => {
    try {
      const [metersRes, readingsRes] = await Promise.all([
        metersAPI.getByProperty(selectedProperty),
        readingsAPI.getAll({ property_id: selectedProperty })
      ]);
      setMeters(metersRes.data);
      setReadings(readingsRes.data);
      calculateMonthlyTotal(readingsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const calculateMonthlyTotal = (readingsData) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let total = 0;
    readingsData.forEach(reading => {
      const readingDate = new Date(reading.date);
      if (readingDate.getMonth() === currentMonth && 
          readingDate.getFullYear() === currentYear &&
          reading.previous_value &&
          reading.unit_price) {
        const consumption = parseFloat(reading.value) - parseFloat(reading.previous_value);
        const cost = consumption * parseFloat(reading.unit_price);
        total += cost;
      }
    });
    
    setMonthlyTotal(total);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await readingsAPI.create(formData);
      setShowForm(false);
      setFormData({
        meter_id: '',
        reading_date: new Date().toISOString().split('T')[0],
        value: '',
        notes: ''
      });
      loadMetersAndReadings();
      alert('✅ Reading added successfully!');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
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

  if (properties.length === 0) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🏠 My Dashboard</h1>
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>You don't have access to any properties yet.</p>
          <p style={styles.emptySubtext}>Please contact your administrator to grant you access.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏠 My Dashboard</h1>

      {properties.length > 1 && (
        <div style={styles.propertySelector}>
          <label style={styles.label}>Select Property:</label>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            style={styles.select}
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={styles.summaryCard}>
        <h2 style={styles.summaryTitle}>💰 This Month's Total</h2>
        <p style={styles.summaryAmount}>{monthlyTotal.toFixed(2)} RON</p>
        <p style={styles.summarySubtext}>Based on your current readings</p>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>⚡ My Meters</h2>
          {!showForm && (
            <button onClick={() => setShowForm(true)} style={styles.addBtn}>
              + Add Reading
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <h3 style={styles.formTitle}>➕ Add New Reading</h3>
            
            <select
              value={formData.meter_id}
              onChange={(e) => setFormData({ ...formData, meter_id: e.target.value })}
              style={styles.input}
              required
            >
              <option value="">Select Meter *</option>
              {meters.map(m => (
                <option key={m.id} value={m.id}>
                  {m.utility_type === 'electricity' && '⚡'}
                  {m.utility_type === 'gas' && '🔥'}
                  {m.utility_type === 'water' && '💧'}
                  {m.utility_type === 'heating' && '🌡️'}
                  {' '}{m.utility_type} - {m.meter_number}
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
              placeholder="Current Reading Value *"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              style={styles.input}
              required
            />

            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
            />

            <div style={styles.formActions}>
              <button type="submit" style={styles.submitBtn}>✅ Save Reading</button>
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    meter_id: '',
                    reading_date: new Date().toISOString().split('T')[0],
                    value: '',
                    notes: ''
                  });
                }} 
                style={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div style={styles.metersGrid}>
          {meters.map((meter) => {
            const meterReadings = readings.filter(r => r.meter_id === meter.id).slice(0, 1);
            const lastReading = meterReadings[0];
            
            return (
              <div key={meter.id} style={styles.meterCard}>
                <h3 style={styles.meterTitle}>
                  {meter.utility_type === 'electricity' && '⚡'}
                  {meter.utility_type === 'gas' && '🔥'}
                  {meter.utility_type === 'water' && '💧'}
                  {meter.utility_type === 'heating' && '🌡️'}
                  {' '}{meter.utility_type}
                </h3>
                <p style={styles.meterText}>Meter: {meter.meter_number}</p>
                
                {lastReading && (
                  <>
                    <p style={styles.meterText}>
                      Last Reading: {parseFloat(lastReading.value).toFixed(2)}
                    </p>
                    <p style={styles.meterText}>
                      Date: {new Date(lastReading.date).toLocaleDateString()}
                    </p>
                    <div style={styles.consumption}>
                      <div style={styles.consumptionItem}>
                        <span style={styles.consumptionLabel}>Consumption:</span>
                        <span style={styles.consumptionValue}>
                          {calculateConsumption(lastReading)} units
                        </span>
                      </div>
                      <div style={styles.consumptionItem}>
                        <span style={styles.consumptionLabel}>Cost:</span>
                        <span style={styles.consumptionValue}>
                          {calculateCost(lastReading)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                
                {!lastReading && (
                  <p style={styles.noReading}>No readings yet</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📊 Recent Readings</h2>
        <div style={styles.table}>
          <table style={styles.tableElement}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Utility</th>
                <th style={styles.th}>Reading</th>
                <th style={styles.th}>Consumption</th>
                <th style={styles.th}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {readings.slice(0, 10).map((reading) => (
                <tr key={reading.id} style={styles.tr}>
                  <td style={styles.td}>{new Date(reading.date).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    {reading.utility_type === 'electricity' && '⚡'}
                    {reading.utility_type === 'gas' && '🔥'}
                    {reading.utility_type === 'water' && '💧'}
                    {reading.utility_type === 'heating' && '🌡️'}
                    {' '}{reading.utility_type}
                  </td>
                  <td style={styles.td}>{parseFloat(reading.value).toFixed(2)}</td>
                  <td style={styles.td}>{calculateConsumption(reading)}</td>
                  <td style={styles.td}>{calculateCost(reading)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {readings.length === 0 && (
          <p style={styles.empty}>No readings yet. Add your first reading above!</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' },
  title: { fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '2rem' },
  propertySelector: { marginBottom: '2rem' },
  label: { fontSize: '1rem', fontWeight: '500', color: '#374151', marginRight: '1rem' },
  select: { padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '1rem', backgroundColor: 'white', minWidth: '250px' },
  summaryCard: { backgroundColor: '#4F46E5', color: 'white', padding: '2rem', borderRadius: '0.5rem', textAlign: 'center', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
  summaryTitle: { fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' },
  summaryAmount: { fontSize: '3rem', fontWeight: 'bold', margin: '0.5rem 0' },
  summarySubtext: { fontSize: '0.95rem', opacity: 0.9 },
  section: { marginBottom: '3rem' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  sectionTitle: { fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' },
  addBtn: { backgroundColor: '#10B981', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' },
  form: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB' },
  formTitle: { margin: '0 0 1rem 0', color: '#111827', fontSize: '1.25rem' },
  input: { width: '100%', padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '1rem', marginBottom: '1rem', boxSizing: 'border-box' },
  formActions: { display: 'flex', gap: '1rem' },
  submitBtn: { flex: 1, backgroundColor: '#10B981', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' },
  cancelBtn: { flex: 1, backgroundColor: '#6B7280', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' },
  metersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  meterCard: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB' },
  meterTitle: { fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.75rem', textTransform: 'capitalize' },
  meterText: { fontSize: '0.9rem', color: '#6B7280', marginBottom: '0.5rem' },
  consumption: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' },
  consumptionItem: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
  consumptionLabel: { fontSize: '0.9rem', color: '#6B7280' },
  consumptionValue: { fontSize: '0.9rem', fontWeight: '600', color: '#4F46E5' },
  noReading: { fontSize: '0.9rem', color: '#9CA3AF', fontStyle: 'italic', marginTop: '1rem' },
  table: { backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'auto' },
  tableElement: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#F3F4F6', borderBottom: '2px solid #E5E7EB' },
  th: { padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.9rem' },
  tr: { borderBottom: '1px solid #E5E7EB' },
  td: { padding: '1rem', color: '#6B7280', fontSize: '0.9rem' },
  empty: { textAlign: 'center', color: '#9CA3AF', padding: '3rem', fontSize: '1.1rem', backgroundColor: 'white', borderRadius: '0.5rem' },
  emptyState: { backgroundColor: 'white', padding: '3rem', borderRadius: '0.5rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' },
  emptyText: { fontSize: '1.25rem', color: '#111827', marginBottom: '0.5rem' },
  emptySubtext: { fontSize: '1rem', color: '#6B7280' }
};

export default TenantDashboard;