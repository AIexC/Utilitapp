import React, { useState, useEffect } from 'react';
import { dashboardAPI, propertiesAPI } from '../api/api';

const Reports = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedProperty, setSelectedProperty] = useState('');
  const [properties, setProperties] = useState([]);
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const propsRes = await propertiesAPI.getAll();
        setProperties(propsRes.data);

        const params = { month: month.toString(), year: year.toString() };
        if (selectedProperty) params.property_id = selectedProperty;

        const [summaryRes, monthlyRes, activityRes] = await Promise.all([
          dashboardAPI.getSummary(params),
          dashboardAPI.getMonthlyByLandlord(params),
          dashboardAPI.getRecentActivity({ limit: 10 })
        ]);

        setSummary(summaryRes.data);
        setMonthlyData(monthlyRes.data);
        setRecentActivity(activityRes.data);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [month, year, selectedProperty]);

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📈 Reports & Analytics</h1>

      <div style={styles.filters}>
        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          style={styles.select}
        >
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>

        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          style={styles.select}
        >
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
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
          <h3 style={styles.statTitle}>Total Landlords</h3>
          <p style={styles.statValue}>{summary?.landlords_count || 0}</p>
        </div>
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
          <h3 style={styles.statTitle}>Bills This Month</h3>
          <p style={styles.statValue}>{summary?.bills_count || 0}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Unverified Bills</h3>
          <p style={styles.statValue}>{summary?.unverified_bills_count || 0}</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>💰 Monthly Costs by Landlord</h2>
        {monthlyData && monthlyData.length > 0 ? (
          <div style={styles.table}>
            <table style={styles.tableElement}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Landlord</th>
                  <th style={styles.th}>Properties</th>
                  <th style={styles.th}>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((landlord, idx) => (
                  <React.Fragment key={idx}>
                    <tr style={styles.landlordRow}>
                      <td style={{ ...styles.td, fontWeight: 'bold' }}>
                        🏢 {landlord.name}
                      </td>
                      <td style={styles.td}>{landlord.properties?.length || 0}</td>
                      <td style={{ ...styles.td, fontWeight: 'bold', color: '#4F46E5' }}>
                        {parseFloat(landlord.total || 0).toFixed(2)} RON
                      </td>
                    </tr>
                    {landlord.properties && landlord.properties.map((prop, pidx) => (
                      <tr key={`${idx}-${pidx}`} style={styles.propertyRow}>
                        <td style={{ ...styles.td, paddingLeft: '2rem' }}>
                          🏠 {prop.name}
                        </td>
                        <td style={styles.td}>{prop.bill_count} bills</td>
                        <td style={styles.td}>
                          {parseFloat(prop.total || 0).toFixed(2)} RON
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.empty}>No billing data for selected period.</p>
        )}
      </div>

      {recentActivity && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🕐 Recent Activity</h2>
          <div style={styles.activityGrid}>
            <div style={styles.activitySection}>
              <h3 style={styles.activityTitle}>📊 Recent Readings</h3>
              {recentActivity.recent_readings && recentActivity.recent_readings.length > 0 ? (
                <div style={styles.activityList}>
                  {recentActivity.recent_readings.slice(0, 5).map((reading) => (
                    <div key={reading.id} style={styles.activityItem}>
                      <p style={styles.activityText}>
                        <strong>{reading.property_name}</strong>
                      </p>
                      <p style={styles.activitySubtext}>
                        {reading.utility_type === 'electricity' && '⚡'}
                        {reading.utility_type === 'gas' && '🔥'}
                        {reading.utility_type === 'water' && '💧'}
                        {reading.utility_type === 'heating' && '🌡️'}
                        {' '}{reading.utility_type} - {parseFloat(reading.value).toFixed(2)}
                      </p>
                      <p style={styles.activityDate}>
                        {new Date(reading.date).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyActivity}>No recent readings</p>
              )}
            </div>

            <div style={styles.activitySection}>
              <h3 style={styles.activityTitle}>🧾 Recent Bills</h3>
              {recentActivity.recent_bills && recentActivity.recent_bills.length > 0 ? (
                <div style={styles.activityList}>
                  {recentActivity.recent_bills.slice(0, 5).map((bill) => (
                    <div key={bill.id} style={styles.activityItem}>
                      <p style={styles.activityText}>
                        <strong>{bill.property_name}</strong>
                      </p>
                      <p style={styles.activitySubtext}>
                        {bill.utility_type} - {parseFloat(bill.amount).toFixed(2)} RON
                      </p>
                      <p style={styles.activityDate}>
                        {new Date(bill.date).toLocaleString()}
                        {' '}{bill.verified ? '✅' : '⚠️'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyActivity}>No recent bills</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={styles.infoBox}>
        <h3 style={styles.infoTitle}>💡 Reports Features</h3>
        <ul style={styles.infoList}>
          <li>✅ View monthly costs by landlord and property</li>
          <li>✅ Filter by month, year, and property</li>
          <li>✅ Track readings and bills activity</li>
          <li>✅ Monitor unverified bills</li>
          <li>📅 Historical data comparison (coming soon)</li>
          <li>📊 Charts and graphs (coming soon)</li>
          <li>📄 Export to PDF/Excel (coming soon)</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' },
  title: { fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '2rem' },
  filters: { display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' },
  select: { padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '1rem', backgroundColor: 'white', minWidth: '150px' },
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
  landlordRow: { backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' },
  propertyRow: { borderBottom: '1px solid #F3F4F6' },
  td: { padding: '1rem', color: '#6B7280', fontSize: '0.9rem' },
  empty: { textAlign: 'center', color: '#9CA3AF', padding: '3rem', fontSize: '1.1rem', backgroundColor: 'white', borderRadius: '0.5rem' },
  activityGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' },
  activitySection: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB' },
  activityTitle: { fontSize: '1.1rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' },
  activityList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  activityItem: { padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.375rem', borderLeft: '3px solid #4F46E5' },
  activityText: { fontSize: '0.95rem', color: '#111827', marginBottom: '0.25rem' },
  activitySubtext: { fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' },
  activityDate: { fontSize: '0.75rem', color: '#9CA3AF' },
  emptyActivity: { textAlign: 'center', color: '#9CA3AF', padding: '2rem', fontSize: '0.9rem' },
  infoBox: { backgroundColor: '#EEF2FF', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #C7D2FE' },
  infoTitle: { fontSize: '1.1rem', fontWeight: 'bold', color: '#4F46E5', marginBottom: '1rem' },
  infoList: { color: '#4338CA', lineHeight: '1.8', paddingLeft: '1.5rem' }
};

export default Reports;