const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Get dashboard summary
router.get('/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetDate = month && year ? `${year}-${month.padStart(2, '0')}-01` : new Date().toISOString().split('T')[0];
    
    // Get counts
    const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM landlords) as landlords_count,
        (SELECT COUNT(*) FROM properties) as properties_count,
        (SELECT COUNT(*) FROM rooms) as rooms_count,
        (SELECT COUNT(*) FROM readings WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', $1::date)) as readings_count,
        (SELECT COUNT(*) FROM bills WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', $1::date)) as bills_count,
        (SELECT COUNT(*) FROM bills WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', $1::date) AND verified = false) as unverified_bills_count
    `, [targetDate]);

    res.json(counts.rows[0]);
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get monthly costs by landlord
router.get('/monthly-by-landlord', async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetDate = month && year ? `${year}-${month.padStart(2, '0')}-01` : new Date().toISOString().split('T')[0];
    
    const result = await pool.query(`
      SELECT 
        l.id as landlord_id,
        l.name as landlord_name,
        p.id as property_id,
        p.name as property_name,
        SUM(b.amount) as total_amount,
        COUNT(b.id) as bill_count
      FROM landlords l
      JOIN properties p ON l.id = p.landlord_id
      JOIN bills b ON p.id = b.property_id
      WHERE DATE_TRUNC('month', b.date) = DATE_TRUNC('month', $1::date)
      GROUP BY l.id, l.name, p.id, p.name
      ORDER BY l.name, p.name
    `, [targetDate]);

    // Group by landlord
    const landlords = {};
    result.rows.forEach(row => {
      if (!landlords[row.landlord_id]) {
        landlords[row.landlord_id] = {
          id: row.landlord_id,
          name: row.landlord_name,
          total: 0,
          properties: []
        };
      }
      
      landlords[row.landlord_id].total += parseFloat(row.total_amount);
      landlords[row.landlord_id].properties.push({
        id: row.property_id,
        name: row.property_name,
        total: parseFloat(row.total_amount),
        bill_count: parseInt(row.bill_count)
      });
    });

    res.json(Object.values(landlords));
  } catch (error) {
    console.error('Get monthly by landlord error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recent activity
router.get('/recent-activity', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const readings = await pool.query(`
      SELECT r.*, m.utility_type, p.name as property_name
      FROM readings r
      JOIN meters m ON r.meter_id = m.id
      JOIN properties p ON m.property_id = p.id
      ORDER BY r.created_at DESC
      LIMIT $1
    `, [limit]);

    const bills = await pool.query(`
      SELECT b.*, p.name as property_name
      FROM bills b
      JOIN properties p ON b.property_id = p.id
      ORDER BY b.created_at DESC
      LIMIT $1
    `, [limit]);

    res.json({
      recent_readings: readings.rows,
      recent_bills: bills.rows
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
