import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.action) params.append('action', filters.action);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await axios.get(`${API_URL}/api/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/audit-logs/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      setShowStats(true);
    } catch (error) {
      console.error('Error loading stats:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'CREATE': return '#10B981';
      case 'UPDATE': return '#3B82F6';
      case 'DELETE': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getEntityIcon = (entityType) => {
    const icons = {
      landlord: '🏢',
      property: '🏠',
      room: '🚪',
      meter: '⚡',
      reading: '📊',
      bill: '🧾',
      user: '👤'
    };
    return icons[entityType] || '📝';
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>👑 Audit Logs</h1>
        <button onClick={loadStats} style={styles.statsBtn}>
          📊 View Statistics
        </button>
      </div>

      {showStats && stats && (
        <div style={styles.statsModal}>
          <div style={styles.statsContent}>
            <div style={styles.statsHeader}>
              <h2 style={styles.statsTitle}>📊 Audit Statistics</h2>
              <button onClick={() => setShowStats(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <h3>Top Active Users</h3>
                {stats.top_users?.slice(0, 5).map(user => (
                  <div key={user.user_id} style={styles.statItem}>
                    <span>{user.username}</span>
                    <span style={styles.statValue}>{user.action_count} actions</span>
                  </div>
                ))}
              </div>

              <div style={styles.statCard}>
                <h3>Actions by Type</h3>
                {stats.action_stats?.slice(0, 10).map((stat, idx) => (
                  <div key={idx} style={styles.statItem}>
                    <span>{getEntityIcon(stat.entity_type)} {stat.entity_type} - {stat.action}</span>
                    <span style={styles.statValue}>{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.filters}>
        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          style={styles.select}
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>

        <select
          value={filters.entity_type}
          onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
          style={styles.select}
        >
          <option value="">All Entity Types</option>
          <option value="landlord">Landlord</option>
          <option value="property">Property</option>
          <option value="room">Room</option>
          <option value="meter">Meter</option>
          <option value="reading">Reading</option>
          <option value="bill">Bill</option>
          <option value="user">User</option>
        </select>

        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          style={styles.input}
          placeholder="Start Date"
        />

        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          style={styles.input}
          placeholder="End Date"
        />

        <button 
          onClick={() => setFilters({ action: '', entity_type: '', start_date: '', end_date: '' })}
          style={styles.clearBtn}
        >
          Clear Filters
        </button>
      </div>

      <div style={styles.logsList}>
        {logs.length === 0 ? (
          <p style={styles.empty}>No audit logs found for selected filters.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} style={styles.logCard}>
              <div style={styles.logHeader}>
                <div style={styles.logInfo}>
                  <span style={{
                    ...styles.actionBadge,
                    backgroundColor: getActionColor(log.action)
                  }}>
                    {log.action}
                  </span>
                  <span style={styles.entityType}>
                    {getEntityIcon(log.entity_type)} {log.entity_type}
                  </span>
                </div>
                <span style={styles.logDate}>{formatDate(log.created_at)}</span>
              </div>

              <div style={styles.logBody}>
                <p style={styles.logText}>
                  <strong>User:</strong> {log.username || 'System'} (ID: {log.user_id || 'N/A'})
                </p>
                {log.entity_name && (
                  <p style={styles.logText}>
                    <strong>Entity:</strong> {log.entity_name} (ID: {log.entity_id})
                  </p>
                )}
                {log.ip_address && (
                  <p style={styles.logText}>
                    <strong>IP:</strong> {log.ip_address}
                  </p>
                )}
                {log.changes && (
                  <details style={styles.changes}>
                    <summary style={styles.changesSummary}>View Changes</summary>
                    <pre style={styles.changesContent}>
                      {JSON.stringify(log.changes, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '2rem', fontWeight: 'bold', color: '#111827' },
  statsBtn: { backgroundColor: '#8B5CF6', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' },
  filters: { display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' },
  select: { padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '1rem', backgroundColor: 'white', minWidth: '150px' },
  input: { padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '1rem', minWidth: '150px' },
  clearBtn: { backgroundColor: '#6B7280', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem' },
  logsList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  logCard: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB' },
  logHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' },
  logInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
  actionBadge: { color: 'white', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: '600' },
  entityType: { fontSize: '1rem', fontWeight: '500', color: '#374151' },
  logDate: { fontSize: '0.85rem', color: '#6B7280' },
  logBody: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  logText: { fontSize: '0.9rem', color: '#374151', margin: 0 },
  changes: { marginTop: '0.5rem', cursor: 'pointer' },
  changesSummary: { fontSize: '0.9rem', color: '#4F46E5', fontWeight: '500' },
  changesContent: { backgroundColor: '#F3F4F6', padding: '1rem', borderRadius: '0.375rem', fontSize: '0.8rem', overflow: 'auto', marginTop: '0.5rem' },
  empty: { textAlign: 'center', color: '#9CA3AF', padding: '3rem', fontSize: '1.1rem', backgroundColor: 'white', borderRadius: '0.5rem' },
  statsModal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  statsContent: { backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', maxWidth: '900px', width: '90%', maxHeight: '80vh', overflow: 'auto' },
  statsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  statsTitle: { fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 },
  closeBtn: { backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1.25rem', width: '2rem', height: '2rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' },
  statCard: { backgroundColor: '#F9FAFB', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #E5E7EB' },
  statItem: { display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #E5E7EB' },
  statValue: { fontWeight: '600', color: '#4F46E5' }
};

export default AuditLogs;