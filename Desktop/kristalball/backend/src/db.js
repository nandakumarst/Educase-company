const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const db = new sqlite3.Database('./data/military_assets.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Bases table
    db.run(`CREATE TABLE IF NOT EXISTS bases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      capacity INTEGER,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Assets table
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

    // Maintenance table
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

    // Purchases table
    db.run(`CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      base_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      purchase_date DATETIME NOT NULL,
      supplier TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (base_id) REFERENCES bases(id)
    )`);

    // Transfers table
    db.run(`CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      from_base_id INTEGER NOT NULL,
      to_base_id INTEGER NOT NULL,
      transfer_date DATETIME NOT NULL,
      status TEXT NOT NULL,
      approved_by INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (from_base_id) REFERENCES bases(id),
      FOREIGN KEY (to_base_id) REFERENCES bases(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )`);

    // Create indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_assets_base_id ON assets(base_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_maintenance_asset_id ON maintenance(asset_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_purchases_base_id ON purchases(base_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_purchases_asset_id ON purchases(asset_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_transfers_from_base_id ON transfers(from_base_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_transfers_to_base_id ON transfers(to_base_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_transfers_asset_id ON transfers(asset_id)');
  });
}

module.exports = db; 