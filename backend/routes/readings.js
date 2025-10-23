const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Get readings
router.get('/', async (req, res) => {
  try {
    const { property_id, meter_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        r.*, 
        m.utility_type, 
        m.meter_number,
        m.unit_price,
        p.name as property_name,
        LAG(r.value) OVER (PARTITION BY r.meter_id ORDER BY r.date) as previous_value
      FROM readings r
      JOIN meters m ON r.meter_id = m.id
      JOIN properties p ON m.property_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (property_id) {
      query += ` AND m.property_id = $${paramCount}`;
      params.push(property_id);
      paramCount++;
    }

    if (meter_id) {
      query += ` AND r.meter_id = $${paramCount}`;
      params.push(meter_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND r.date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND r.date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ' ORDER BY r.date DESC, r.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get readings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create reading
router.post('/', async (req, res) => {
  try {
    const { meter_id, reading_date, value, notes } = req.body;
    
    if (!meter_id || !reading_date || !value) {
      return res.status(400).json({ error: 'meter_id, reading_date and value required' });
    }

    const result = await pool.query(
      `INSERT INTO readings (meter_id, date, value, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [meter_id, reading_date, value, notes, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create reading error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete reading
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM readings WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found' });
    }
    res.json({ message: 'Reading deleted successfully' });
  } catch (error) {
    console.error('Delete reading error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;