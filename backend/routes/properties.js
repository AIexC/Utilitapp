const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Helper to check property access
const checkPropertyAccess = async (userId, propertyId, userRole) => {
  if (userRole === 'admin') return true;
  
  const result = await pool.query(
    'SELECT id FROM user_property_access WHERE user_id = $1 AND property_id = $2',
    [userId, propertyId]
  );
  return result.rows.length > 0;
};

// Get all accessible properties
router.get('/', async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'admin') {
      query = `
        SELECT p.*, l.name as landlord_name,
               COUNT(DISTINCT r.id) as room_count,
               COUNT(DISTINCT m.id) as meter_count
        FROM properties p
        LEFT JOIN landlords l ON p.landlord_id = l.id
        LEFT JOIN rooms r ON p.id = r.property_id
        LEFT JOIN meters m ON p.id = m.property_id
        GROUP BY p.id, l.name
        ORDER BY p.name
      `;
      params = [];
    } else {
      query = `
        SELECT p.*, l.name as landlord_name,
               COUNT(DISTINCT r.id) as room_count,
               COUNT(DISTINCT m.id) as meter_count
        FROM properties p
        JOIN user_property_access upa ON p.id = upa.property_id
        LEFT JOIN landlords l ON p.landlord_id = l.id
        LEFT JOIN rooms r ON p.id = r.property_id
        LEFT JOIN meters m ON p.id = m.property_id
        WHERE upa.user_id = $1
        GROUP BY p.id, l.name
        ORDER BY p.name
      `;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single property
router.get('/:id', async (req, res) => {
  try {
    const hasAccess = await checkPropertyAccess(req.user.id, req.params.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(`
      SELECT p.*, l.name as landlord_name, l.email as landlord_email, l.phone as landlord_phone
      FROM properties p
      LEFT JOIN landlords l ON p.landlord_id = l.id
      WHERE p.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create property
router.post('/', async (req, res) => {
  try {
    const { name, address, landlord_id } = req.body;
    if (!name || !landlord_id) {
      return res.status(400).json({ error: 'Name and landlord_id required' });
    }

    const result = await pool.query(
      `INSERT INTO properties (name, address, landlord_id, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, address, landlord_id, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update property
router.put('/:id', async (req, res) => {
  try {
    const hasAccess = await checkPropertyAccess(req.user.id, req.params.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, address, landlord_id } = req.body;
    const result = await pool.query(
      `UPDATE properties 
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           landlord_id = COALESCE($3, landlord_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name, address, landlord_id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete property
router.delete('/:id', async (req, res) => {
  try {
    const hasAccess = await checkPropertyAccess(req.user.id, req.params.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query('DELETE FROM properties WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
