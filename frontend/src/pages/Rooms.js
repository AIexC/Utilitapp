import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { roomsAPI } from '../api/api';

const Rooms = () => {
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('property');
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    square_meters: '',
    property_id: propertyId
  });

  useEffect(() => {
    if (propertyId) loadRooms();
  }, [propertyId]);

  const loadRooms = async () => {
    try {
      const response = await roomsAPI.getByProperty(propertyId);
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await roomsAPI.create({ ...formData, property_id: propertyId });
      setShowForm(false);
      setFormData({ name: '', square_meters: '', property_id: propertyId });
      loadRooms();
    } catch (error) {
      alert('Error creating room: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this room?')) {
      try {
        await roomsAPI.delete(id);
        loadRooms();
      } catch (error) {
        alert('Error: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  if (!propertyId) {
    return <div style={styles.container}>Please select a property first</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🚪 Rooms</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? 'Cancel' : '+ Add Room'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Room Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={styles.input}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Square Meters *"
            value={formData.square_meters}
            onChange={(e) => setFormData({ ...formData, square_meters: e.target.value })}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.submitBtn}>Create Room</button>
        </form>
      )}

      <div style={styles.grid}>
        {rooms.map((room) => (
          <div key={room.id} style={styles.card}>
            <h3 style={styles.cardTitle}>{room.name}</h3>
            <p style={styles.cardText}>📏 {room.square_meters} m²</p>
            <button onClick={() => handleDelete(room.id)} style={styles.deleteBtn}>
              Delete
            </button>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <p style={styles.empty}>No rooms yet. Add one!</p>
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
  submitBtn: { backgroundColor: '#10B981', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' },
  card: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB' },
  cardTitle: { fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#111827' },
  cardText: { color: '#6B7280', marginBottom: '0.5rem', fontSize: '0.9rem' },
  deleteBtn: { backgroundColor: '#EF4444', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.9rem', marginTop: '1rem', width: '100%' },
  empty: { textAlign: 'center', color: '#9CA3AF', padding: '3rem', fontSize: '1.1rem' }
};

export default Rooms;