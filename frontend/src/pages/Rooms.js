import React, { useState, useEffect } from 'react';
import { roomsAPI, propertiesAPI } from '../api/api';

const Rooms = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    square_meters: ''
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const response = await roomsAPI.getByProperty(selectedProperty);
        setRooms(response.data);
      } catch (error) {
        console.error('Error loading rooms:', error);
      }
    };

    if (selectedProperty) {
      loadRooms();
    } else {
      setRooms([]);
    }
  }, [selectedProperty]);

  const loadProperties = async () => {
    try {
      const response = await propertiesAPI.getAll();
      setProperties(response.data);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      square_meters: room.square_meters
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingRoom(null);
    setShowForm(false);
    setFormData({ name: '', square_meters: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await roomsAPI.update(editingRoom.id, formData);
      } else {
        await roomsAPI.create({ ...formData, property_id: selectedProperty });
      }
      handleCancelEdit();
      // Reload rooms
      const response = await roomsAPI.getByProperty(selectedProperty);
      setRooms(response.data);
    } catch (error) {
      alert(`Error ${editingRoom ? 'updating' : 'creating'} room: ` + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this room?')) {
      try {
        await roomsAPI.delete(id);
        // Reload rooms
        const response = await roomsAPI.getByProperty(selectedProperty);
        setRooms(response.data);
      } catch (error) {
        alert('Error: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🚪 Rooms</h1>
        {selectedProperty && !showForm && (
          <button onClick={() => setShowForm(true)} style={styles.addBtn}>
            + Add Room
          </button>
        )}
      </div>

      <div style={styles.filterSection}>
        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          style={styles.select}
        >
          <option value="">Select Property *</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {!selectedProperty ? (
        <p style={styles.empty}>Please select a property to view and manage rooms.</p>
      ) : (
        <>
          {showForm && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <h3 style={{ margin: 0, marginBottom: '1rem', color: '#111827' }}>
                {editingRoom ? '✏️ Edit Room' : '➕ Add New Room'}
              </h3>
              
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
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" style={styles.submitBtn}>
                  {editingRoom ? '💾 Update Room' : '✅ Create Room'}
                </button>
                <button type="button" onClick={handleCancelEdit} style={styles.cancelBtn}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div style={styles.grid}>
            {rooms.map((room) => (
              <div key={room.id} style={styles.card}>
                <h3 style={styles.cardTitle}>{room.name}</h3>
                <p style={styles.cardText}>📏 {room.square_meters} m²</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button onClick={() => handleEdit(room)} style={styles.editBtn}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(room.id)} style={styles.deleteBtn}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {rooms.length === 0 && !showForm && (
            <p style={styles.empty}>No rooms yet. Add your first room!</p>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '2rem', fontWeight: 'bold', color: '#111827' },
  addBtn: { backgroundColor: '#4F46E5', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' },
  filterSection: { marginBottom: '2rem' },
  select: { width: '100%', maxWidth: '400px', padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '1rem', backgroundColor: 'white' },
  form: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '1rem' },
  submitBtn: { backgroundColor: '#10B981', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500', flex: 1 },
  cancelBtn: { backgroundColor: '#6B7280', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '500', flex: 1 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' },
  card: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB' },
  cardTitle: { fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#111827' },
  cardText: { color: '#6B7280', marginBottom: '0.5rem', fontSize: '0.9rem' },
  editBtn: { backgroundColor: '#3B82F6', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.9rem', flex: 1 },
  deleteBtn: { backgroundColor: '#EF4444', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.9rem', flex: 1 },
  empty: { textAlign: 'center', color: '#9CA3AF', padding: '3rem', fontSize: '1.1rem' }
};

export default Rooms;