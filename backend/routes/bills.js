const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { pool } = require('../database');
const { verifyToken } = require('./auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(verifyToken);

// Get bills
router.get('/', async (req, res) => {
  try {
    const { property_id, utility_type, start_date, end_date, verified } = req.query;
    
    let query = `
      SELECT b.*, p.name as property_name
      FROM bills b
      JOIN properties p ON b.property_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (property_id) {
      query += ` AND b.property_id = $${paramCount}`;
      params.push(property_id);
      paramCount++;
    }

    if (utility_type) {
      query += ` AND b.utility_type = $${paramCount}`;
      params.push(utility_type);
      paramCount++;
    }

    if (start_date) {
      query += ` AND b.date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND b.date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    if (verified !== undefined) {
      query += ` AND b.verified = $${paramCount}`;
      params.push(verified === 'true');
      paramCount++;
    }

    query += ' ORDER BY b.date DESC, b.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create bill with image upload
router.post('/', upload.single('image'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { property_id, utility_type, date, amount, consumption } = req.body;
    
    if (!property_id || !utility_type || !date || !amount) {
      return res.status(400).json({ error: 'property_id, utility_type, date and amount required' });
    }

    let imageUrl = null;
    let imagePublicId = null;

    // Upload image to Cloudinary if provided
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: 'airbnb-bills',
        resource_type: 'auto'
      });
      
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO bills (property_id, utility_type, date, amount, consumption, image_url, image_public_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [property_id, utility_type, date, amount, consumption, imageUrl, imagePublicId, req.user.id]
    );

    // Auto-update utility price if consumption is provided
    if (consumption && parseFloat(consumption) > 0) {
      const newPrice = parseFloat(amount) / parseFloat(consumption);
      await client.query(
        `UPDATE utility_prices SET price = $1, updated_at = CURRENT_TIMESTAMP WHERE utility_type = $2`,
        [newPrice, utility_type]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create bill error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Update bill verification status
router.patch('/:id/verify', async (req, res) => {
  try {
    const { verified } = req.body;
    
    const result = await pool.query(
      `UPDATE bills 
       SET verified = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [verified, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Verify bill error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete bill
router.delete('/:id', async (req, res) => {
  try {
    const billResult = await pool.query('SELECT image_public_id FROM bills WHERE id = $1', [req.params.id]);
    
    if (billResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Delete from Cloudinary if exists
    if (billResult.rows[0].image_public_id) {
      try {
        await cloudinary.uploader.destroy(billResult.rows[0].image_public_id);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
      }
    }

    await pool.query('DELETE FROM bills WHERE id = $1', [req.params.id]);
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
