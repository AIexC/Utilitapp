const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Initialize database schema
const initializeDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Landlords table
    await client.query(`
      CREATE TABLE IF NOT EXISTS landlords (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        bank_account VARCHAR(50),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Properties table
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address TEXT,
        landlord_id INTEGER REFERENCES landlords(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Rooms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        square_meters DECIMAL(10, 2) NOT NULL,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Meters table
    await client.query(`
      CREATE TABLE IF NOT EXISTS meters (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        utility_type VARCHAR(20) NOT NULL,
        meter_number VARCHAR(50) NOT NULL,
        split_method VARCHAR(20) DEFAULT 'area',
        unit_price DECIMAL(10, 4),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Meter-Rooms junction table (many-to-many)
    await client.query(`
      CREATE TABLE IF NOT EXISTS meter_rooms (
        id SERIAL PRIMARY KEY,
        meter_id INTEGER NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
        room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(meter_id, room_id)
      )
    `);

    // Readings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY,
        meter_id INTEGER REFERENCES meters(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        value DECIMAL(10, 2) NOT NULL,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bills table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        meter_id INTEGER REFERENCES meters(id) ON DELETE CASCADE,
        reading_id INTEGER REFERENCES readings(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        image_url TEXT,
        verified BOOLEAN DEFAULT false,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Utility prices table (global default prices)
    await client.query(`
      CREATE TABLE IF NOT EXISTS utility_prices (
        id SERIAL PRIMARY KEY,
        utility_type VARCHAR(20) UNIQUE NOT NULL,
        price DECIMAL(10, 4) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User property access table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_property_access (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        access_level VARCHAR(20) DEFAULT 'read',
        granted_by INTEGER REFERENCES users(id),
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, property_id)
      )
    `);

    // Insert default utility prices
    await client.query(`
      INSERT INTO utility_prices (utility_type, price)
      VALUES 
        ('electricity', 0.65),
        ('gas', 0.35),
        ('water', 8.50),
        ('heating', 450.00)
      ON CONFLICT (utility_type) DO NOTHING
    `);

    // Insert admin user only if not exists (ON CONFLICT DO NOTHING)
    await client.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('admin', 'admin@example.com', '$2a$10$mIWJ0yExCM8fudZZHUcba.yIZnZkpUmjR16xbV059E6QrSalUAzS.', 'admin')
      ON CONFLICT (username) DO NOTHING
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id);
      CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms(property_id);
      CREATE INDEX IF NOT EXISTS idx_meters_property ON meters(property_id);
      CREATE INDEX IF NOT EXISTS idx_meter_rooms_meter ON meter_rooms(meter_id);
      CREATE INDEX IF NOT EXISTS idx_meter_rooms_room ON meter_rooms(room_id);
      CREATE INDEX IF NOT EXISTS idx_readings_meter ON readings(meter_id);
      CREATE INDEX IF NOT EXISTS idx_readings_date ON readings(date);
      CREATE INDEX IF NOT EXISTS idx_bills_meter ON bills(meter_id);
      CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
      CREATE INDEX IF NOT EXISTS idx_user_access ON user_property_access(user_id, property_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, initializeDatabase };