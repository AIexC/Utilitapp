const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Get all landlords
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, COUNT(DISTINCT p.id) as property_count
      FROM landlords l
      LEFT JOIN properties p ON l.id = p.landlord_id
      GROUP BY l.id
      ORDER BY l.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get landlords error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single landlord
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM landlords WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Landlord not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get landlord error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create landlord
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, bank_account } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      `INSERT INTO landlords (name, email, phone, bank_account, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, phone, bank_account, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create landlord error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update landlord
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, bank_account } = req.body;
    const result = await pool.query(
      `UPDATE landlords 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           bank_account = COALESCE($4, bank_account),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, email, phone, bank_account, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Landlord not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update landlord error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete landlord
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM landlords WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Landlord not found' });
    }
    res.json({ message: 'Landlord deleted successfully' });
  } catch (error) {
    console.error('Delete landlord error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
