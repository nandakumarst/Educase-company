const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('Created data directory');
}

// Create default admin user
async function createDefaultAdmin() {
  const email = 'admin@military.gov';
  const password = 'admin123'; // This should be changed in production
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    'INSERT OR IGNORE INTO users (email, password, role) VALUES (?, ?, ?)',
    [email, hashedPassword, 'admin'],
    function(err) {
      if (err) {
        console.error('Error creating default admin:', err);
      } else if (this.changes > 0) {
        console.log('Default admin user created');
      } else {
        console.log('Default admin user already exists');
      }
    }
  );
}

// Initialize database
db.serialize(() => {
  // Create tables
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    capacity INTEGER,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    serial_number TEXT UNIQUE NOT NULL,
    base_id INTEGER,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    date DATETIME NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    cost REAL,
    technician TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id)
  )`);

  // Create indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_assets_base_id ON assets(base_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_maintenance_asset_id ON maintenance(asset_id)');

  // Create default admin user
  createDefaultAdmin();
});

console.log('Database initialization complete'); 