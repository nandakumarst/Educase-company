const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Get all assets with optional status filter
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, base_id } = req.query;
    const user = req.user;

    let query = `
      SELECT a.*, 
             at.name as asset_type_name,
             b.name as base_name
      FROM assets a
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN bases b ON a.base_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (base_id) {
      query += ' AND a.base_id = ?';
      params.push(base_id);
    }

    // Base commanders can only see assets at their base
    if (user.role === 'base_commander') {
      query += ' AND a.base_id = ?';
      params.push(user.base_id);
    }

    query += ' ORDER BY a.created_at DESC';

    const assets = await db.all(query, params);
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// Get asset by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const asset = await db.get(`
      SELECT a.*, 
             at.name as asset_type_name,
             b.name as base_name
      FROM assets a
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN bases b ON a.base_id = b.id
      WHERE a.id = ?
    `, [id]);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Base commanders can only see assets at their base
    if (user.role === 'base_commander' && user.base_id !== asset.base_id) {
      return res.status(403).json({ error: 'You can only view assets at your base' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// Create new asset
router.post('/', authenticateToken, checkRole(['admin', 'base_commander', 'logistics_officer']), async (req, res) => {
  try {
    const { serial_number, asset_type_id, base_id, condition, purchase_date } = req.body;
    const user = req.user;

    // Validate base_id if user is base_commander or logistics_officer
    if ((user.role === 'base_commander' || user.role === 'logistics_officer') && user.base_id !== base_id) {
      return res.status(403).json({ error: 'You can only add assets to your assigned base' });
    }

    const result = await db.run(
      `INSERT INTO assets (serial_number, asset_type_id, base_id, status, condition, purchase_date, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [serial_number, asset_type_id, base_id, 'available', condition, purchase_date]
    );

    // Log the action
    await db.run(
      `INSERT INTO audit_log (
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [user.id, 'create', 'asset', result.lastID, JSON.stringify(req.body)]
    );

    res.status(201).json({ id: result.lastID, message: 'Asset created successfully' });
  } catch (error) {
    console.error('Error creating asset:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Serial number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create asset' });
    }
  }
});

// Update asset
router.put('/:id', authenticateToken, checkRole(['admin', 'base_commander', 'logistics_officer']), async (req, res) => {
  try {
    const { id } = req.params;
    const { serial_number, asset_type_id, base_id, status, condition, purchase_date, last_maintenance_date } = req.body;
    const user = req.user;

    // Get existing asset to check base_id
    const existingAsset = await db.get('SELECT * FROM assets WHERE id = ?', [id]);
    if (!existingAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Validate base_id if user is base_commander or logistics_officer
    if ((user.role === 'base_commander' || user.role === 'logistics_officer') && user.base_id !== existingAsset.base_id) {
      return res.status(403).json({ error: 'You can only update assets in your assigned base' });
    }

    const result = await db.run(
      'UPDATE assets SET serial_number = ?, asset_type_id = ?, base_id = ?, status = ?, condition = ?, purchase_date = ?, last_maintenance_date = ? WHERE id = ?',
      [serial_number, asset_type_id, base_id, status, condition, purchase_date, last_maintenance_date, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Asset not found or no changes made' });
    }

    // Log the action
    await db.run(`
      INSERT INTO audit_log (
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [user.id, 'update', 'asset', id, JSON.stringify(req.body)]);

    res.json({ message: 'Asset updated successfully' });
  } catch (error) {
    console.error('Error updating asset:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Serial number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update asset' });
    }
  }
});

// Delete asset
router.delete('/:id', authenticateToken, checkRole(['admin', 'base_commander', 'logistics_officer']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Get existing asset to check base_id
    const existingAsset = await db.get('SELECT * FROM assets WHERE id = ?', [id]);
    if (!existingAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Validate base_id if user is base_commander or logistics_officer
    if ((user.role === 'base_commander' || user.role === 'logistics_officer') && user.base_id !== existingAsset.base_id) {
      return res.status(403).json({ error: 'You can only delete assets from your assigned base' });
    }

    const result = await db.run('DELETE FROM assets WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Log the action
    await db.run(`
      INSERT INTO audit_log (
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [user.id, 'delete', 'asset', id, null, null]);

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

module.exports = router; 