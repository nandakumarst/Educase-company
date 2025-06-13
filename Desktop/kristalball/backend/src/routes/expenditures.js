const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Get all expenditures with optional filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, base_id, asset_id } = req.query;
    const user = req.user;

    let query = `
      SELECT e.*, 
        a.serial_number as asset_serial_number,
        a.asset_type_name,
        b.name as base_name,
        u.username as created_by_username
      FROM expenditures e
      JOIN assets a ON e.asset_id = a.id
      JOIN bases b ON e.base_id = b.id
      JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }
    if (base_id) {
      query += ' AND e.base_id = ?';
      params.push(base_id);
    }
    if (asset_id) {
      query += ' AND e.asset_id = ?';
      params.push(asset_id);
    }

    // Base commanders can only see expenditures from their base
    if (user.role === 'base_commander') {
      query += ' AND e.base_id = ?';
      params.push(user.base_id);
    }

    // Regular users can only see expenditures they created
    if (user.role === 'user') {
      query += ' AND e.created_by = ?';
      params.push(user.id);
    }

    query += ' ORDER BY e.created_at DESC';

    const expenditures = await db.all(query, params);
    res.json(expenditures);
  } catch (error) {
    console.error('Error fetching expenditures:', error);
    res.status(500).json({ error: 'Failed to fetch expenditures' });
  }
});

// Create new expenditure
router.post('/', authenticateToken, checkRole(['admin', 'base_commander', 'logistics_officer']), async (req, res) => {
  try {
    const { asset_id, base_id, expenditure_date, reason, quantity } = req.body;
    const user = req.user;

    // Validate base_id if user is base_commander or logistics_officer
    if ((user.role === 'base_commander' || user.role === 'logistics_officer') && user.base_id !== base_id) {
      return res.status(403).json({ error: 'You can only create expenditures for your assigned base' });
    }

    // Check if asset exists and is available/assigned
    const asset = await db.get('SELECT * FROM assets WHERE id = ?', [asset_id]);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (asset.status === 'expended') {
      return res.status(400).json({ error: 'Asset is already expended' });
    }

    // Create expenditure record
    const result = await db.run(`
      INSERT INTO expenditures (
        asset_id, base_id, expenditure_date,
        reason, quantity, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [asset_id, base_id, expenditure_date, reason, quantity, user.id]);

    // Update asset status if quantity matches available
    if (quantity >= 1) { // Assuming one asset per expenditure for now, adjust if quantity applies to items within an asset
      await db.run('UPDATE assets SET status = ? WHERE id = ?', ['expended', asset_id]);
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
    `, [user.id, 'create', 'expenditure', result.lastID, JSON.stringify(req.body)]);

    res.status(201).json({ id: result.lastID, message: 'Expenditure recorded successfully' });
  } catch (error) {
    console.error('Error creating expenditure:', error);
    res.status(500).json({ error: 'Failed to create expenditure' });
  }
});

// Get expenditure details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const expenditure = await db.get(`
      SELECT e.*, 
        a.serial_number as asset_serial_number,
        a.asset_type_name,
        b.name as base_name,
        u.username as created_by_username
      FROM expenditures e
      JOIN assets a ON e.asset_id = a.id
      JOIN bases b ON e.base_id = b.id
      JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `, [id]);

    if (!expenditure) {
      return res.status(404).json({ error: 'Expenditure not found' });
    }

    // Check permissions
    if (user.role === 'base_commander' && user.base_id !== expenditure.base_id) {
      return res.status(403).json({ error: 'You can only view expenditures from your base' });
    }
    if (user.role === 'user' && expenditure.created_by !== user.id) {
      return res.status(403).json({ error: 'You can only view your own expenditures' });
    }

    res.json(expenditure);
  } catch (error) {
    console.error('Error fetching expenditure details:', error);
    res.status(500).json({ error: 'Failed to fetch expenditure details' });
  }
});

module.exports = router; 