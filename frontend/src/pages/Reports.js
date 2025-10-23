import React, { useState, useEffect } from 'react';
import { dashboardAPI, propertiesAPI, roomsAPI } from '../api/api';

const Reports = () => {
  const [period, setPeriod] = useState('month');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [properties, setProperties] = useState([]);
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period, selectedProperty]);

  const loadData = async () => {
    try {
      const propsRes = await propertiesAPI.getAll();
      setProperties(propsRes.data);

      const params = {};
      if (selectedProperty) params.property_id = selectedProperty;

      const [summaryRes, monthlyRes] = await Promise.all([
        dashboardAPI.getSummary(params),
        dashboardAPI.getMonthlyByLandlord(params)
      ]);

      setSummary(summaryRes.data);
      setMonthlyData(monthlyRes.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📈 Reports & Analytics</h1>

      <div style={styles.filters}>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={styles.select}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>

        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          style={styles.select}
        >
          <option value="">All Properties</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Properties</h3>
          <p style={styles.statValue}>{summary?.properties_count || 0}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Total Rooms</h3>
          <p style={styles.statValue}>{summary?.rooms_count || 0}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Readings This Month</h3>
          <p style={styles.statValue}>{summary?.readings_count || 0}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Unverified Bills</h3>
          <p style={styles.statValue}>{summary?.unverified_bills_count || 0}</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Monthly Costs by Landlord</h2>
        <div style={styles.table}>
          <table style={styles.tableElement}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Landlord</th>
                <th style={styles.th}>Properties</th>
                <th style={styles.th}>⚡ Electricity</th>
                <th style={styles.th}>🔥 Gas</th>
                <th style={styles.th}>💧 Water</th>
                <th style={styles.th}>🌡️ Heating</th>
                <th style={styles.th}>Total</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((row, idx) => (
                <tr key={idx} style={styles.tr}>
                  <td style={styles.td}>{row.landlord_name}</td>
                  <td style={styles.td}>{row.property_count || 0}</td>
                  <td style={styles.td}>
                    {parseFloat(row.electricity_total || 0).toFixed(2)} RON
                  </td>
                  <td style={styles.td}>
                    {parseFloat(row.gas_total || 0).toFixed(2)} RON
                  </td>
                  <td style={styles.td}>
                    {parseFloat(row.water_total || 0).toFixed(2)} RON
                  </td>
                  <td style={styles.td}>
                    {parseFloat(row.heating_total || 0).toFixed(2)} RON
                  </td>
                  <td style={{ ...styles.td, fontWeight: 'bold' }}>
                    {parseFloat(row.total || 0).toFixed(2)} RON
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {monthlyData.length === 0 && (
        <p style={styles.empty}>No data available for the selected period.</p>
      )}

      <div style={styles.infoBox}>
        <h3 style={styles.infoTitle}>💡 Reports Features</h3>
        <ul style={styles.infoList}>
          <li>View consumption and costs by property, room, or landlord</li>
          <li>Compare different time periods</li>
          <li>Track utility price changes over time</li>
          <li>Identify high-consumption properties or rooms</li>
          <li>Export data for accounting (coming soon)</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' },
  title: { fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '2rem' },
  filters: { display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' },
  select: { padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '1rem', backgroundColor: 'white', minWidth: '200px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  statCard: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB', textAlign: 'center' },
  statTitle: { fontSize: '0.9rem', color: '#6B7280', marginBottom: '0.5rem' },
  statValue: { fontSize: '2rem', fontWeight: 'bold', color: '#4F46E5' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' },
  table: { backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'auto' },
  tableElement: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#F3F4F6', borderBottom: '2px solid #E5E7EB' },
  th: { padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.9rem' },
  tr: { borderBottom: '1px solid #E5E7EB' },
  td: { padding: '1rem', color: '#6B7280', fontSize: '0.9rem' },
  empty: { textAlign: 'center', color: '#9CA3AF', padding: '3rem', fontSize: '1.1rem', backgroundColor: 'white', borderRadius: '0.5rem' },
  infoBox: { backgroundColor: '#EEF2FF', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #C7D2FE' },
  infoTitle: { fontSize: '1.1rem', fontWeight: 'bold', color: '#4F46E5', marginBottom: '1rem' },
  infoList: { color: '#4338CA', lineHeight: '1.8', paddingLeft: '1.5rem' }
};

export default Reports;