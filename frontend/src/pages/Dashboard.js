import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../api/api';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await dashboardAPI.getSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Dashboard</h1>
      
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🏢 Landlords</h3>
          <p style={styles.cardValue}>{summary?.landlords_count || 0}</p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🏠 Properties</h3>
          <p style={styles.cardValue}>{summary?.properties_count || 0}</p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🚪 Rooms</h3>
          <p style={styles.cardValue}>{summary?.rooms_count || 0}</p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📊 Readings (This Month)</h3>
          <p style={styles.cardValue}>{summary?.readings_count || 0}</p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🧾 Bills (This Month)</h3>
          <p style={styles.cardValue}>{summary?.bills_count || 0}</p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>⚠️ Unverified Bills</h3>
          <p style={styles.cardValue}>{summary?.unverified_bills_count || 0}</p>
        </div>
      </div>
      
      <div style={styles.infoBox}>
        <p>✅ API Connected: https://utilitapp-production.up.railway.app</p>
        <p>📱 Use the navigation above to manage your utilities</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '2rem',
    color: '#111827'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #E5E7EB'
  },
  cardTitle: {
    fontSize: '1rem',
    color: '#6B7280',
    marginBottom: '0.5rem'
  },
  cardValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#4F46E5'
  },
  infoBox: {
    backgroundColor: '#EEF2FF',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    border: '1px solid #C7D2FE'
  }
};

export default Dashboard;