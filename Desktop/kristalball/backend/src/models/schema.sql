-- Users and Roles
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role_id INTEGER NOT NULL,
    base_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (base_id) REFERENCES bases(id)
);

-- Bases
CREATE TABLE bases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset Types
CREATE TABLE asset_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL -- e.g., 'weapon', 'vehicle', 'ammunition'
);

-- Assets
CREATE TABLE assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_number TEXT NOT NULL UNIQUE,
    asset_type_id INTEGER NOT NULL,
    base_id INTEGER NOT NULL,
    status TEXT NOT NULL, -- 'available', 'assigned', 'expended', 'in_transfer'
    condition TEXT NOT NULL, -- 'new', 'good', 'fair', 'poor'
    purchase_date DATE,
    last_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_type_id) REFERENCES asset_types(id),
    FOREIGN KEY (base_id) REFERENCES bases(id)
);

-- Purchases
CREATE TABLE purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_type_id INTEGER NOT NULL,
    base_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    purchase_date DATE NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'approved', 'completed', 'cancelled'
    approved_by INTEGER,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_type_id) REFERENCES asset_types(id),
    FOREIGN KEY (base_id) REFERENCES bases(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Transfers
CREATE TABLE transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    from_base_id INTEGER NOT NULL,
    to_base_id INTEGER NOT NULL,
    transfer_date DATE NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'approved', 'completed', 'cancelled'
    reason TEXT,
    approved_by INTEGER,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (from_base_id) REFERENCES bases(id),
    FOREIGN KEY (to_base_id) REFERENCES bases(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Assignments
CREATE TABLE assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    assigned_to TEXT NOT NULL, -- Personnel ID or Name
    base_id INTEGER NOT NULL,
    assignment_date DATE NOT NULL,
    return_date DATE,
    status TEXT NOT NULL, -- 'active', 'returned', 'expended'
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (base_id) REFERENCES bases(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Expenditures
CREATE TABLE expenditures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    base_id INTEGER NOT NULL,
    expenditure_date DATE NOT NULL,
    reason TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    approved_by INTEGER,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (base_id) REFERENCES bases(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Audit Log
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    old_values TEXT,
    new_values TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Personnel
CREATE TABLE personnel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rank TEXT NOT NULL,
    unit TEXT,
    base_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'Full access to all data and operations'),
('base_commander', 'Access to data and operations for assigned base'),
('logistics_officer', 'Limited access to purchases and transfers');

-- Insert some default bases
INSERT INTO bases (name, location) VALUES
('Alpha Base', 'Location A'),
('Bravo Base', 'Location B'),
('Charlie Base', 'Location C');

-- Insert some default asset types
INSERT INTO asset_types (name, description, category) VALUES
('M4 Carbine', 'Standard issue rifle', 'weapon'),
('HMMWV', 'High Mobility Multipurpose Wheeled Vehicle', 'vehicle'),
('5.56mm Ammunition', 'Standard rifle ammunition', 'ammunition'),
('M9 Pistol', 'Standard issue sidearm', 'weapon'),
('MRAP', 'Mine Resistant Ambush Protected vehicle', 'vehicle');

-- Insert a default admin user (password: adminpass)
INSERT INTO users (username, password_hash, email, role_id, base_id) VALUES
('admin', '$2b$10$O0F.2S.G/Z0E4T8T.Z.V4O.W2R2L1K5G5B7A.Z8H9P0N1M2Q3S4R5V6Y7X9Z', 'admin@example.com', (SELECT id FROM roles WHERE name = 'admin'), NULL);

-- Insert a default base commander user (password: commanderpass)
INSERT INTO users (username, password_hash, email, role_id, base_id) VALUES
('commander1', '$2b$10$O0F.2S.G/Z0E4T8T.Z.V4O.W2R2L1K5G5B7A.Z8H9P0N1M2Q3S4R5V6Y7X9Z', 'commander1@example.com', (SELECT id FROM roles WHERE name = 'base_commander'), (SELECT id FROM bases WHERE name = 'Alpha Base'));

-- Insert a default user (password: userpass)
INSERT INTO users (username, password_hash, email, role_id, base_id) VALUES
('user1', '$2b$10$O0F.2S.G/Z0E4T8T.Z.V4O.W2R2L1K5G5B7A.Z8H9P0N1M2Q3S4R5V6Y7X9Z', 'user1@example.com', (SELECT id FROM roles WHERE name = 'logistics_officer'), (SELECT id FROM bases WHERE name = 'Alpha Base'));

-- Insert some default personnel
INSERT INTO personnel (name, rank, unit, base_id) VALUES
('John Doe', 'Sergeant', 'Infantry', (SELECT id FROM bases WHERE name = 'Alpha Base')),
('Jane Smith', 'Captain', 'Logistics', (SELECT id FROM bases WHERE name = 'Bravo Base')),
('Peter Jones', 'Private', 'Medical', (SELECT id FROM bases WHERE name = 'Alpha Base'));

-- Insert some default assets
INSERT INTO assets (serial_number, asset_type_id, base_id, status, condition, purchase_date) VALUES
('M4-001', (SELECT id FROM asset_types WHERE name = 'M4 Carbine'), (SELECT id FROM bases WHERE name = 'Alpha Base'), 'available', 'new', '2023-01-15'),
('HMMWV-001', (SELECT id FROM asset_types WHERE name = 'HMMWV'), (SELECT id FROM bases WHERE name = 'Bravo Base'), 'available', 'good', '2022-03-20'),
('M4-002', (SELECT id FROM asset_types WHERE name = 'M4 Carbine'), (SELECT id FROM bases WHERE name = 'Alpha Base'), 'available', 'new', '2023-02-10'),
('M9-001', (SELECT id FROM asset_types WHERE name = 'M9 Pistol'), (SELECT id FROM bases WHERE name = 'Alpha Base'), 'available', 'good', '2023-04-01'); 