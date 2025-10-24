const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { verifyToken } = require('./auth');
const { isSuperAdmin } = require('../middleware/permissions');

// All routes require super admin
router.use(verifyToken);
router.use(isSuperAdmin);

// Get audit logs with filters and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      user_id, 
      action, 
      entity_type, 
      start_date, 
      end_date,
      limit = 100,
      offset = 0 
    } = req.query;
    
    let query = `
      SELECT 
        al.*,
        u.username as current_username,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (user_id) {
      query += ` AND al.user_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }

    if (action) {
      query += ` AND al.action = $${paramCount}`;
      params.push(action);
      paramCount++;
    }

    if (entity_type) {
      query += ` AND al.entity_type = $${paramCount}`;
      params.push(entity_type);
      paramCount++;
    }

    if (start_date) {
      query += ` AND al.created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND al.created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM audit_logs WHERE 1=1`;
    const countResult = await pool.query(countQuery);
    
    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get audit logs for specific entity
router.get('/entity/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        al.*,
        u.username as current_username,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = $1 AND al.entity_id = $2
      ORDER BY al.created_at DESC`,
      [entityType, entityId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get entity audit logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get audit statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        action,
        entity_type,
        COUNT(*) as count,
        MAX(created_at) as last_action
      FROM audit_logs
      GROUP BY action, entity_type
      ORDER BY count DESC
    `);

    const userActivity = await pool.query(`
      SELECT 
        user_id,
        username,
        COUNT(*) as action_count,
        MAX(created_at) as last_activity
      FROM audit_logs
      WHERE user_id IS NOT NULL
      GROUP BY user_id, username
      ORDER BY action_count DESC
      LIMIT 10
    `);

    const recentActivity = await pool.query(`
      SELECT 
        al.*,
        u.username as current_username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 20
    `);

    res.json({
      action_stats: stats.rows,
      top_users: userActivity.rows,
      recent_activity: recentActivity.rows
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;