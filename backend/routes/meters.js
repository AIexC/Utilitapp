const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Get meters for a property WITH their assigned rooms
router.get('/property/:propertyId', async (req, res) => {
  try {
    // Get meters
    const metersResult = await pool.query(
      `SELECT 
        m.*,
        r.name as room_name,
        p.name as property_name
      FROM meters m
      LEFT JOIN rooms r ON m.room_id = r.id
      LEFT JOIN properties p ON m.property_id = p.id
      WHERE m.property_id = $1 
      ORDER BY m.utility_type, m.meter_number`,
      [req.params.propertyId]
    );

    // For each meter, get all assigned rooms
    const meters = await Promise.all(metersResult.rows.map(async (meter) => {
      const roomsResult = await pool.query(
        `SELECT r.id, r.name, r.square_meters
         FROM meter_rooms mr
         JOIN rooms r ON mr.room_id = r.id
         WHERE mr.meter_id = $1
         ORDER BY r.name`,
        [meter.id]
      );
      
      return {
        ...meter,
        assigned_rooms: roomsResult.rows
      };
    }));

    res.json(meters);
  } catch (error) {
    console.error('Get meters error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create meter WITH multiple rooms
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { property_id, room_id, room_ids, utility_type, meter_number, split_method, unit_price } = req.body;
    
    if (!property_id || !utility_type || !meter_number) {
      return res.status(400).json({ error: 'property_id, utility_type and meter_number required' });
    }

    await client.query('BEGIN');

    // Create meter
    const meterResult = await client.query(
      `INSERT INTO meters (property_id, room_id, utility_type, meter_number, split_method, unit_price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [property_id, room_id || null, utility_type, meter_number, split_method || 'area', unit_price || null]
    );

    const meter = meterResult.rows[0];

    // If room_ids provided (array of room IDs), create meter_rooms entries
    if (room_ids && Array.isArray(room_ids) && room_ids.length > 0) {
      for (const roomId of room_ids) {
        await client.query(
          `INSERT INTO meter_rooms (meter_id, room_id)
           VALUES ($1, $2)
           ON CONFLICT (meter_id, room_id) DO NOTHING`,
          [meter.id, roomId]
        );
      }
    }

    await client.query('COMMIT');

    // Get the created meter with assigned rooms
    const roomsResult = await client.query(
      `SELECT r.id, r.name, r.square_meters
       FROM meter_rooms mr
       JOIN rooms r ON mr.room_id = r.id
       WHERE mr.meter_id = $1`,
      [meter.id]
    );

    res.status(201).json({
      ...meter,
      assigned_rooms: roomsResult.rows
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create meter error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Update meter AND its assigned rooms
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { meter_number, split_method, unit_price, room_ids } = req.body;
    
    await client.query('BEGIN');

    // Update meter
    const meterResult = await client.query(
      `UPDATE meters 
       SET meter_number = COALESCE($1, meter_number),
           split_method = COALESCE($2, split_method),
           unit_price = COALESCE($3, unit_price),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [meter_number, split_method, unit_price, req.params.id]
    );

    if (meterResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Meter not found' });
    }

    // If room_ids provided, update meter_rooms
    if (room_ids && Array.isArray(room_ids)) {
      // Delete existing assignments
      await client.query(
        'DELETE FROM meter_rooms WHERE meter_id = $1',
        [req.params.id]
      );

      // Add new assignments
      if (room_ids.length > 0) {
        for (const roomId of room_ids) {
          await client.query(
            `INSERT INTO meter_rooms (meter_id, room_id)
             VALUES ($1, $2)
             ON CONFLICT (meter_id, room_id) DO NOTHING`,
            [req.params.id, roomId]
          );
        }
      }
    }

    await client.query('COMMIT');

    // Get updated meter with assigned rooms
    const roomsResult = await client.query(
      `SELECT r.id, r.name, r.square_meters
       FROM meter_rooms mr
       JOIN rooms r ON mr.room_id = r.id
       WHERE mr.meter_id = $1`,
      [req.params.id]
    );

    res.json({
      ...meterResult.rows[0],
      assigned_rooms: roomsResult.rows
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update meter error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Delete meter (cascade will delete meter_rooms automatically)
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

// NEW: Get room consumption breakdown for a specific reading
router.get('/:meterId/room-breakdown/:readingId', async (req, res) => {
  try {
    const { meterId, readingId } = req.params;

    // Get reading info
    const readingResult = await pool.query(
      `SELECT r.*, m.split_method, m.unit_price,
              LAG(r.value) OVER (PARTITION BY r.meter_id ORDER BY r.date) as previous_value
       FROM readings r
       JOIN meters m ON r.meter_id = m.id
       WHERE r.id = $1 AND r.meter_id = $2`,
      [readingId, meterId]
    );

    if (readingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    const reading = readingResult.rows[0];
    const consumption = reading.previous_value 
      ? parseFloat(reading.value) - parseFloat(reading.previous_value)
      : parseFloat(reading.value);

    // Get assigned rooms
    const roomsResult = await pool.query(
      `SELECT r.id, r.name, r.square_meters
       FROM meter_rooms mr
       JOIN rooms r ON mr.room_id = r.id
       WHERE mr.meter_id = $1
       ORDER BY r.name`,
      [meterId]
    );

    if (roomsResult.rows.length === 0) {
      return res.json({
        total_consumption: consumption,
        total_cost: reading.unit_price ? consumption * parseFloat(reading.unit_price) : null,
        rooms: []
      });
    }

    // Calculate breakdown based on split_method
    const rooms = roomsResult.rows;
    const totalSquareMeters = rooms.reduce((sum, room) => sum + parseFloat(room.square_meters), 0);

    let breakdown;
    if (reading.split_method === 'area') {
      // Split by area (square meters)
      breakdown = rooms.map(room => {
        const percentage = parseFloat(room.square_meters) / totalSquareMeters;
        const roomConsumption = consumption * percentage;
        const roomCost = reading.unit_price ? roomConsumption * parseFloat(reading.unit_price) : null;

        return {
          room_id: room.id,
          room_name: room.name,
          square_meters: room.square_meters,
          percentage: (percentage * 100).toFixed(2),
          consumption: roomConsumption.toFixed(2),
          cost: roomCost ? roomCost.toFixed(2) : null
        };
      });
    } else if (reading.split_method === 'equal') {
      // Split equally
      const roomConsumption = consumption / rooms.length;
      const roomCost = reading.unit_price ? roomConsumption * parseFloat(reading.unit_price) : null;

      breakdown = rooms.map(room => ({
        room_id: room.id,
        room_name: room.name,
        square_meters: room.square_meters,
        percentage: (100 / rooms.length).toFixed(2),
        consumption: roomConsumption.toFixed(2),
        cost: roomCost ? roomCost.toFixed(2) : null
      }));
    } else {
      // Custom or individual - not implemented yet
      breakdown = rooms.map(room => ({
        room_id: room.id,
        room_name: room.name,
        square_meters: room.square_meters,
        percentage: 'N/A',
        consumption: 'N/A',
        cost: 'N/A'
      }));
    }

    res.json({
      reading_id: reading.id,
      reading_date: reading.date,
      total_consumption: consumption.toFixed(2),
      total_cost: reading.unit_price ? (consumption * parseFloat(reading.unit_price)).toFixed(2) : null,
      split_method: reading.split_method,
      rooms: breakdown
    });
  } catch (error) {
    console.error('Get room breakdown error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;