const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database(path.join(__dirname, 'military_assets.db'));

const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

const initializeDatabase = async () => {
  try {
    // Enable foreign keys
    await runQuery('PRAGMA foreign_keys = ON');

    // Create Users table first
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Roles table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_name TEXT UNIQUE NOT NULL,
        description TEXT
      )
    `);

    // Create UserRoles table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER,
        role_id INTEGER,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    // Create Bases table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS bases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        base_name TEXT UNIQUE NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create UserBases table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS user_bases (
        user_id INTEGER,
        base_id INTEGER,
        PRIMARY KEY (user_id, base_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (base_id) REFERENCES bases(id)
      )
    `);

    // Create EquipmentTypes table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS equipment_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type_name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Assets table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_type_id INTEGER NOT NULL,
        model_name TEXT NOT NULL,
        serial_number TEXT UNIQUE,
        current_base_id INTEGER,
        quantity INTEGER DEFAULT 1,
        status TEXT DEFAULT 'operational',
        is_fungible BOOLEAN DEFAULT FALSE,
        current_balance INTEGER,
        last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id),
        FOREIGN KEY (current_base_id) REFERENCES bases(id)
      )
    `);

    // Create Purchases table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_cost DECIMAL(10,2),
        total_cost DECIMAL(10,2),
        purchase_date DATE NOT NULL,
        supplier_info TEXT,
        receiving_base_id INTEGER NOT NULL,
        purchase_order_number TEXT UNIQUE,
        recorded_by_user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id),
        FOREIGN KEY (receiving_base_id) REFERENCES bases(id),
        FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
      )
    `);

    // Create Transfers table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        source_base_id INTEGER NOT NULL,
        destination_base_id INTEGER NOT NULL,
        transfer_date TIMESTAMP NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        initiated_by_user_id INTEGER NOT NULL,
        received_by_user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id),
        FOREIGN KEY (source_base_id) REFERENCES bases(id),
        FOREIGN KEY (destination_base_id) REFERENCES bases(id),
        FOREIGN KEY (initiated_by_user_id) REFERENCES users(id),
        FOREIGN KEY (received_by_user_id) REFERENCES users(id)
      )
    `);

    // Create Assignments table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        assigned_to_user_id INTEGER NOT NULL,
        assignment_date DATE NOT NULL,
        base_of_assignment_id INTEGER NOT NULL,
        purpose TEXT,
        expected_return_date DATE,
        returned_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        recorded_by_user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id),
        FOREIGN KEY (assigned_to_user_id) REFERENCES users(id),
        FOREIGN KEY (base_of_assignment_id) REFERENCES bases(id),
        FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
      )
    `);

    // Create Expenditures table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS expenditures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        quantity_expended INTEGER NOT NULL,
        expenditure_date DATE NOT NULL,
        base_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        reported_by_user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id),
        FOREIGN KEY (base_id) REFERENCES bases(id),
        FOREIGN KEY (reported_by_user_id) REFERENCES users(id)
      )
    `);

    // Create AuditLogs table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        status TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Insert default roles
    await runQuery(`
      INSERT OR IGNORE INTO roles (role_name, description)
      VALUES 
        ('admin', 'Full system access'),
        ('base_commander', 'Base-level access'),
        ('logistics_officer', 'Limited access for logistics operations')
    `);

    // Insert default admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await runQuery(`
      INSERT OR IGNORE INTO users (username, password_hash, email, full_name)
      VALUES ('admin', ?, 'admin@military.gov', 'System Administrator')
    `, [adminPassword]);

    // Assign admin role to admin user
    await runQuery(`
      INSERT OR IGNORE INTO user_roles (user_id, role_id)
      SELECT u.id, r.id
      FROM users u, roles r
      WHERE u.username = 'admin' AND r.role_name = 'admin'
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    db.close();
  }
};

// Run initialization
initializeDatabase()
  .then(() => {
    console.log('Database setup complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  }); 