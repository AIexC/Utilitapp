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
      JOIN meters m ON p.id = m.property_id
      JOIN bills b ON m.id = b.meter_id
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

// NEW: Get room-level cost breakdown for a property
router.get('/room-costs/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { month, year } = req.query;
    const targetDate = month && year ? `${year}-${month.padStart(2, '0')}-01` : new Date().toISOString().split('T')[0];

    // Get all meters for the property with their assigned rooms
    const metersResult = await pool.query(`
      SELECT 
        m.id as meter_id,
        m.utility_type,
        m.meter_number,
        m.split_method,
        m.unit_price
      FROM meters m
      WHERE m.property_id = $1
    `, [propertyId]);

    const roomCosts = {};
    
    for (const meter of metersResult.rows) {
      // Get assigned rooms for this meter
      const roomsResult = await pool.query(`
        SELECT r.id, r.name, r.square_meters
        FROM meter_rooms mr
        JOIN rooms r ON mr.room_id = r.id
        WHERE mr.meter_id = $1
        ORDER BY r.name
      `, [meter.meter_id]);

      if (roomsResult.rows.length === 0) continue;

      // Get readings for this meter in the target month
      const readingsResult = await pool.query(`
        SELECT 
          r.id,
          r.date,
          r.value,
          LAG(r.value) OVER (ORDER BY r.date) as previous_value
        FROM readings r
        WHERE r.meter_id = $1
          AND DATE_TRUNC('month', r.date) = DATE_TRUNC('month', $2::date)
        ORDER BY r.date DESC
      `, [meter.meter_id, targetDate]);

      // Calculate total consumption for the month
      let totalConsumption = 0;
      readingsResult.rows.forEach(reading => {
        if (reading.previous_value) {
          totalConsumption += parseFloat(reading.value) - parseFloat(reading.previous_value);
        }
      });

      if (totalConsumption === 0) continue;

      const totalCost = meter.unit_price ? totalConsumption * parseFloat(meter.unit_price) : null;
      const rooms = roomsResult.rows;
      const totalSquareMeters = rooms.reduce((sum, r) => sum + parseFloat(r.square_meters), 0);

      // Calculate cost per room
      rooms.forEach(room => {
        if (!roomCosts[room.id]) {
          roomCosts[room.id] = {
            room_id: room.id,
            room_name: room.name,
            square_meters: room.square_meters,
            utilities: {},
            total_cost: 0
          };
        }

        let roomConsumption, roomCost;
        
        if (meter.split_method === 'area') {
          const percentage = parseFloat(room.square_meters) / totalSquareMeters;
          roomConsumption = totalConsumption * percentage;
          roomCost = totalCost ? totalCost * percentage : null;
        } else if (meter.split_method === 'equal') {
          roomConsumption = totalConsumption / rooms.length;
          roomCost = totalCost ? totalCost / rooms.length : null;
        } else {
          roomConsumption = null;
          roomCost = null;
        }

        if (roomCost) {
          roomCosts[room.id].utilities[meter.utility_type] = {
            consumption: roomConsumption ? roomConsumption.toFixed(2) : 'N/A',
            cost: roomCost.toFixed(2)
          };
          roomCosts[room.id].total_cost += parseFloat(roomCost);
        }
      });
    }

    res.json(Object.values(roomCosts));
  } catch (error) {
    console.error('Get room costs error:', error);
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
      SELECT b.*, m.utility_type, p.name as property_name
      FROM bills b
      JOIN meters m ON b.meter_id = m.id
      JOIN properties p ON m.property_id = p.id
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