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

const seedDatabase = async () => {
  try {
    // Insert sample bases
    const bases = [
      { name: 'Fort Bragg', location: 'North Carolina, USA', description: 'Main training base' },
      { name: 'Camp Pendleton', location: 'California, USA', description: 'Marine Corps base' },
      { name: 'Fort Hood', location: 'Texas, USA', description: 'Army base' },
      { name: 'Naval Base San Diego', location: 'California, USA', description: 'Navy base' },
      { name: 'Joint Base Andrews', location: 'Maryland, USA', description: 'Air Force base' }
    ];

    for (const base of bases) {
      await runQuery(
        'INSERT OR IGNORE INTO bases (base_name, location, description) VALUES (?, ?, ?)',
        [base.name, base.location, base.description]
      );
    }

    // Insert sample equipment types
    const equipmentTypes = [
      { name: 'Rifle', category: 'Weapons', description: 'Standard issue rifle' },
      { name: 'Truck', category: 'Vehicles', description: 'Military transport vehicle' },
      { name: 'Radio', category: 'Communications', description: 'Field radio' },
      { name: 'Ammunition', category: 'Weapons', description: 'Standard ammunition' },
      { name: 'Medical Kit', category: 'Medical', description: 'First aid supplies' }
    ];

    for (const type of equipmentTypes) {
      await runQuery(
        'INSERT OR IGNORE INTO equipment_types (type_name, category, description) VALUES (?, ?, ?)',
        [type.name, type.category, type.description]
      );
    }

    // Insert sample assets
    const assets = [
      { type_id: 1, model: 'M4 Carbine', serial: 'RIF001', base_id: 1, quantity: 50, status: 'operational' },
      { type_id: 1, model: 'M4 Carbine', serial: 'RIF002', base_id: 2, quantity: 30, status: 'operational' },
      { type_id: 2, model: 'HMMWV', serial: 'TRK001', base_id: 1, quantity: 10, status: 'operational' },
      { type_id: 2, model: 'HMMWV', serial: 'TRK002', base_id: 3, quantity: 5, status: 'maintenance' },
      { type_id: 3, model: 'AN/PRC-152', serial: 'RAD001', base_id: 1, quantity: 20, status: 'operational' },
      { type_id: 4, model: '5.56mm NATO', serial: 'AMM001', base_id: 1, quantity: 10000, status: 'operational', is_fungible: true },
      { type_id: 5, model: 'IFAK', serial: 'MED001', base_id: 1, quantity: 100, status: 'operational' }
    ];

    for (const asset of assets) {
      await runQuery(
        'INSERT OR IGNORE INTO assets (equipment_type_id, model_name, serial_number, current_base_id, quantity, status, is_fungible) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [asset.type_id, asset.model, asset.serial, asset.base_id, asset.quantity, asset.status, asset.is_fungible || false]
      );
    }

    // Insert sample users
    const users = [
      { username: 'admin', password: 'admin123', email: 'admin@military.gov', full_name: 'System Administrator' },
      { username: 'commander1', password: 'pass123', email: 'commander1@military.gov', full_name: 'Base Commander 1' },
      { username: 'logistics1', password: 'pass123', email: 'logistics1@military.gov', full_name: 'Logistics Officer 1' }
    ];

    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await runQuery(
        'INSERT OR IGNORE INTO users (username, password_hash, email, full_name) VALUES (?, ?, ?, ?)',
        [user.username, passwordHash, user.email, user.full_name]
      );
    }

    // Assign roles to users
    const userRoles = [
      { username: 'admin', role: 'admin' },
      { username: 'commander1', role: 'base_commander' },
      { username: 'logistics1', role: 'logistics_officer' }
    ];

    for (const userRole of userRoles) {
      await runQuery(
        `INSERT OR IGNORE INTO user_roles (user_id, role_id)
         SELECT u.id, r.id
         FROM users u, roles r
         WHERE u.username = ? AND r.role_name = ?`,
        [userRole.username, userRole.role]
      );
    }

    // Insert sample transfers
    const transfers = [
      {
        asset_id: 1,
        quantity: 10,
        source_base_id: 1,
        destination_base_id: 2,
        transfer_date: new Date().toISOString(),
        reason: 'Regular equipment rotation',
        status: 'pending',
        initiated_by_user_id: 2
      },
      {
        asset_id: 3,
        quantity: 2,
        source_base_id: 1,
        destination_base_id: 3,
        transfer_date: new Date(Date.now() - 86400000).toISOString(),
        reason: 'Emergency deployment',
        status: 'approved',
        initiated_by_user_id: 2,
        received_by_user_id: 3
      }
    ];

    for (const transfer of transfers) {
      await runQuery(
        `INSERT OR IGNORE INTO transfers 
         (asset_id, quantity, source_base_id, destination_base_id, transfer_date, reason, status, initiated_by_user_id, received_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transfer.asset_id,
          transfer.quantity,
          transfer.source_base_id,
          transfer.destination_base_id,
          transfer.transfer_date,
          transfer.reason,
          transfer.status,
          transfer.initiated_by_user_id,
          transfer.received_by_user_id
        ]
      );
    }

    // Insert sample purchases
    const purchases = [
      {
        asset_id: 1,
        quantity: 20,
        unit_cost: 1200.00,
        total_cost: 24000.00,
        purchase_date: new Date().toISOString(),
        supplier_info: 'Defense Supplies Inc.',
        receiving_base_id: 1,
        purchase_order_number: 'PO-001',
        recorded_by_user_id: 3
      },
      {
        asset_id: 4,
        quantity: 5000,
        unit_cost: 0.50,
        total_cost: 2500.00,
        purchase_date: new Date(Date.now() - 172800000).toISOString(),
        supplier_info: 'Ammunition Corp',
        receiving_base_id: 2,
        purchase_order_number: 'PO-002',
        recorded_by_user_id: 3
      }
    ];

    for (const purchase of purchases) {
      await runQuery(
        `INSERT OR IGNORE INTO purchases 
         (asset_id, quantity, unit_cost, total_cost, purchase_date, supplier_info, receiving_base_id, purchase_order_number, recorded_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          purchase.asset_id,
          purchase.quantity,
          purchase.unit_cost,
          purchase.total_cost,
          purchase.purchase_date,
          purchase.supplier_info,
          purchase.receiving_base_id,
          purchase.purchase_order_number,
          purchase.recorded_by_user_id
        ]
      );
    }

    console.log('Sample data inserted successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    db.close();
  }
};

// Run seeding
seedDatabase()
  .then(() => {
    console.log('Database seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }); 