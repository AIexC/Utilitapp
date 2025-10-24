const { pool } = require('../database');

/**
 * Check if user is super admin
 */
const isSuperAdmin = (req, res, next) => {
  if (req.user.is_super_admin) {
    return next();
  }
  return res.status(403).json({ error: 'Super admin access required' });
};

/**
 * Check if user is admin or super admin
 */
const isAdmin = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.is_super_admin) {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
};

/**
 * Check if user has access to a specific property
 */
const canAccessProperty = async (userId, propertyId, userRole, isSuperAdmin) => {
  // Super admin and admin have access to all properties
  if (isSuperAdmin || userRole === 'admin') {
    return true;
  }
  
  // Regular users need explicit access
  const result = await pool.query(
    'SELECT id FROM user_property_access WHERE user_id = $1 AND property_id = $2',
    [userId, propertyId]
  );
  
  return result.rows.length > 0;
};

/**
 * Middleware to check property access for readings/bills
 * Extracts property_id from meter_id
 */
const canAccessMeter = async (req, res, next) => {
  // Admin/Super admin bypass
  if (req.user.role === 'admin' || req.user.is_super_admin) {
    return next();
  }
  
  const { meter_id } = req.body;
  if (!meter_id) {
    return res.status(400).json({ error: 'meter_id required' });
  }
  
  try {
    // Get property_id from meter
    const meterResult = await pool.query(
      'SELECT property_id FROM meters WHERE id = $1',
      [meter_id]
    );
    
    if (meterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meter not found' });
    }
    
    const propertyId = meterResult.rows[0].property_id;
    
    // Check if user has access to this property
    const hasAccess = await canAccessProperty(
      req.user.id, 
      propertyId, 
      req.user.role,
      req.user.is_super_admin
    );
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this property' });
    }
    
    next();
  } catch (error) {
    console.error('Error checking meter access:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Middleware to restrict tenants from uploading bills
 */
const canUploadBills = (req, res, next) => {
  if (req.user.role === 'user' && !req.user.is_super_admin) {
    return res.status(403).json({ 
      error: 'Only admins can upload bills. Tenants can only add readings.' 
    });
  }
  next();
};

/**
 * Filter query results based on user access
 */
const filterByUserAccess = async (userId, userRole, isSuperAdmin) => {
  // Super admin and admin see everything
  if (isSuperAdmin || userRole === 'admin') {
    return { whereClause: '', params: [] };
  }
  
  // Regular users only see their properties
  return {
    whereClause: `AND m.property_id IN (
      SELECT property_id FROM user_property_access WHERE user_id = $1
    )`,
    params: [userId]
  };
};

module.exports = {
  isSuperAdmin,
  isAdmin,
  canAccessProperty,
  canAccessMeter,
  canUploadBills,
  filterByUserAccess
};
