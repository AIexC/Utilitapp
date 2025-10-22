const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Get all utility prices
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM utility_prices ORDER BY utility_type');
    res.json(result.rows);
  } catch (error) {
    console.error('Get utility prices error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update utility price
router.put('/:utilityType', async (req, res) => {
  try {
    const { price } = req.body;
    
    if (!price || parseFloat(price) <= 0) {
      return res.status(400).json({ error: 'Valid price required' });
    }

    const result = await pool.query(
      `UPDATE utility_prices 
       SET price = $1, updated_at = CURRENT_TIMESTAMP
       WHERE utility_type = $2
       RETURNING *`,
      [price, req.params.utilityType]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utility type not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update utility price error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
