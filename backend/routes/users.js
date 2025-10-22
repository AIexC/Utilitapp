const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../database');
const { verifyToken, requireAdmin } = require('./auth');

// All routes require authentication and admin role
router.use(verifyToken);
router.use(requireAdmin);

// Get all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, email, role, is_active, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, is_active, created_at`,
      [username, email, hashedPassword, role]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } finally {
    client.release();
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, is_active } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET email = COALESCE($1, email),
           role = COALESCE($2, role),
           is_active = COALESCE($3, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, username, email, role, is_active`,
      [email, role, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset user password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username`,
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's property access
router.get('/:id/property-access', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT upa.*, p.name as property_name, p.address,
             u.username as granted_by_username
      FROM user_property_access upa
      JOIN properties p ON upa.property_id = p.id
      LEFT JOIN users u ON upa.granted_by = u.id
      WHERE upa.user_id = $1
      ORDER BY upa.granted_at DESC
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get property access error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Grant property access to user
router.post('/:id/property-access', async (req, res) => {
  try {
    const { id } = req.params;
    const { propertyId } = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID required' });
    }

    const result = await pool.query(`
      INSERT INTO user_property_access (user_id, property_id, granted_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, property_id) DO NOTHING
      RETURNING *
    `, [id, propertyId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Access already granted or invalid data' });
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Grant property access error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Revoke property access from user
router.delete('/:id/property-access/:propertyId', async (req, res) => {
  try {
    const { id, propertyId } = req.params;

    const result = await pool.query(
      'DELETE FROM user_property_access WHERE user_id = $1 AND property_id = $2 RETURNING *',
      [id, propertyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Access not found' });
    }

    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    console.error('Revoke property access error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
