const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Get rooms for a property
router.get('/property/:propertyId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE property_id = $1 ORDER BY name',
      [req.params.propertyId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create room
router.post('/', async (req, res) => {
  try {
    const { name, square_meters, property_id } = req.body;
    if (!name || !square_meters || !property_id) {
      return res.status(400).json({ error: 'Name, square_meters and property_id required' });
    }

    const result = await pool.query(
      `INSERT INTO rooms (name, square_meters, property_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, square_meters, property_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update room
router.put('/:id', async (req, res) => {
  try {
    const { name, square_meters } = req.body;
    const result = await pool.query(
      `UPDATE rooms 
       SET name = COALESCE($1, name),
           square_meters = COALESCE($2, square_meters),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [name, square_meters, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete room
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
