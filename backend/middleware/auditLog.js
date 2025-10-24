const { pool } = require('../database');

/**
 * Middleware to log all CREATE, UPDATE, DELETE operations
 * Usage: router.post('/', auditLog('CREATE', 'landlord'), async (req, res) => {...})
 */
const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override res.json to capture response
    res.json = function(data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logToDatabase(req, action, entityType, data).catch(err => {
          console.error('Audit log error:', err);
        });
      }
      return originalJson.call(this, data);
    };

    // Override res.send for non-JSON responses
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logToDatabase(req, action, entityType, data).catch(err => {
          console.error('Audit log error:', err);
        });
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Log operation to audit_logs table
 */
const logToDatabase = async (req, action, entityType, responseData) => {
  try {
    const user = req.user;
    if (!user) return; // Skip if no authenticated user

    let entityId = null;
    let entityName = null;
    let changes = null;

    // Extract entity info from response
    if (typeof responseData === 'object' && responseData !== null) {
      entityId = responseData.id || null;
      entityName = responseData.name || responseData.username || responseData.meter_number || null;
      
      // For UPDATE operations, try to capture changes
      if (action === 'UPDATE' && req.body) {
        changes = {
          updated_fields: Object.keys(req.body),
          new_values: req.body
        };
      }
    }

    // Get IP address
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    await pool.query(
      `INSERT INTO audit_logs 
       (user_id, username, action, entity_type, entity_id, entity_name, changes, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user.id,
        user.username,
        action,
        entityType,
        entityId,
        entityName,
        changes ? JSON.stringify(changes) : null,
        ipAddress
      ]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Don't throw - audit logging shouldn't break the main operation
  }
};

/**
 * Manual audit log function for complex operations
 */
const logManual = async (userId, username, action, entityType, entityId, entityName, changes = null, ipAddress = null) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs 
       (user_id, username, action, entity_type, entity_id, entity_name, changes, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, username, action, entityType, entityId, entityName, changes ? JSON.stringify(changes) : null, ipAddress]
    );
  } catch (error) {
    console.error('Failed to write manual audit log:', error);
  }
};

module.exports = { auditLog, logManual };
