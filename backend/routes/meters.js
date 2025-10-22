const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Get meters for a property
router.get('/property/:propertyId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM meters WHERE property_id = $1 ORDER BY utility_type',
      [req.params.propertyId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get meters error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create meter
router.post('/', async (req, res) => {
  try {
    const { property_id, utility_type, meter_type, split_method } = req.body;
    if (!property_id || !utility_type || !meter_type) {
      return res.status(400).json({ error: 'property_id, utility_type and meter_type required' });
    }

    const result = await pool.query(
      `INSERT INTO meters (property_id, utility_type, meter_type, split_method)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [property_id, utility_type, meter_type, split_method]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create meter error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update meter
router.put('/:id', async (req, res) => {
  try {
    const { split_method } = req.body;
    const result = await pool.query(
      `UPDATE meters 
       SET split_method = COALESCE($1, split_method),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [split_method, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meter not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update meter error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete meter
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM meters WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meter not found' });
    }
    res.json({ message: 'Meter deleted successfully' });
  } catch (error) {
    console.error('Delete meter error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
