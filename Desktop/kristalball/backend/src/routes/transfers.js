const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Get all transfers with optional status filter
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const user = req.user;

    let query = `
      SELECT t.*, 
        a.serial_number as asset_serial_number,
        a.asset_type_name,
        fb.name as from_base_name,
        tb.name as to_base_name,
        u.username as requested_by
      FROM transfers t
      JOIN assets a ON t.asset_id = a.id
      JOIN bases fb ON t.from_base_id = fb.id
      JOIN bases tb ON t.to_base_id = tb.id
      JOIN users u ON t.requested_by = u.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by status if provided
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    // Base commanders can only see transfers involving their base
    if (user.role === 'base_commander') {
      query += ' AND (t.from_base_id = ? OR t.to_base_id = ?)';
      params.push(user.base_id, user.base_id);
    }

    // Regular users can only see transfers they requested
    if (user.role === 'user') {
      query += ' AND t.requested_by = ?';
      params.push(user.id);
    }

    query += ' ORDER BY t.created_at DESC';

    const transfers = await db.all(query, params);
    res.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

// Create new transfer
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      asset_id,
      from_base_id,
      to_base_id,
      transfer_date,
      reason
    } = req.body;

    const user = req.user;

    // Validate user permissions
    if (user.role === 'user' && user.base_id !== from_base_id) {
      return res.status(403).json({ error: 'You can only request transfers from your base' });
    }

    // Check if asset exists and is available
    const asset = await db.get('SELECT * FROM assets WHERE id = ?', [asset_id]);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (asset.status !== 'available') {
      return res.status(400).json({ error: 'Asset is not available for transfer' });
    }

    // Check if bases exist
    const [fromBase, toBase] = await Promise.all([
      db.get('SELECT * FROM bases WHERE id = ?', [from_base_id]),
      db.get('SELECT * FROM bases WHERE id = ?', [to_base_id])
    ]);

    if (!fromBase || !toBase) {
      return res.status(404).json({ error: 'One or both bases not found' });
    }

    // Create transfer record
    const result = await db.run(`
      INSERT INTO transfers (
        asset_id,
        from_base_id,
        to_base_id,
        transfer_date,
        reason,
        status,
        requested_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, datetime('now'))
    `, [asset_id, from_base_id, to_base_id, transfer_date, reason, user.id]);

    // Update asset status
    await db.run('UPDATE assets SET status = ? WHERE id = ?', ['pending_transfer', asset_id]);

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
    `, [user.id, 'create', 'transfer', result.lastID, JSON.stringify(req.body)]);

    res.status(201).json({
      id: result.lastID,
      message: 'Transfer request created successfully'
    });
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
});

// Update transfer status
router.patch('/:id/status', authenticateToken, checkRole(['admin', 'base_commander']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    // Validate status
    const validStatuses = ['pending', 'approved', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get transfer details
    const transfer = await db.get(`
      SELECT t.*, a.status as asset_status
      FROM transfers t
      JOIN assets a ON t.asset_id = a.id
      WHERE t.id = ?
    `, [id]);

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    // Check permissions
    if (user.role === 'base_commander' && 
        user.base_id !== transfer.from_base_id && 
        user.base_id !== transfer.to_base_id) {
      return res.status(403).json({ error: 'You can only update transfers involving your base' });
    }

    // Update transfer status
    await db.run('UPDATE transfers SET status = ? WHERE id = ?', [status, id]);

    // Update asset status based on transfer status
    let assetStatus = transfer.asset_status;
    if (status === 'approved') {
      assetStatus = 'pending_transfer';
    } else if (status === 'completed') {
      assetStatus = 'available';
    } else if (status === 'cancelled') {
      assetStatus = 'available';
    }

    await db.run('UPDATE assets SET status = ?, base_id = ? WHERE id = ?', 
      [assetStatus, status === 'completed' ? transfer.to_base_id : transfer.from_base_id, transfer.asset_id]);

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
    `, [user.id, 'update_status', 'transfer', id, JSON.stringify({ status })]);

    res.json({ message: 'Transfer status updated successfully' });
  } catch (error) {
    console.error('Error updating transfer status:', error);
    res.status(500).json({ error: 'Failed to update transfer status' });
  }
});

// Get transfer details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const transfer = await db.get(`
      SELECT t.*, 
        a.serial_number as asset_serial_number,
        a.asset_type_name,
        fb.name as from_base_name,
        tb.name as to_base_name,
        u.username as requested_by
      FROM transfers t
      JOIN assets a ON t.asset_id = a.id
      JOIN bases fb ON t.from_base_id = fb.id
      JOIN bases tb ON t.to_base_id = tb.id
      JOIN users u ON t.requested_by = u.id
      WHERE t.id = ?
    `, [id]);

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    // Check permissions
    if (user.role === 'user' && transfer.requested_by !== user.id) {
      return res.status(403).json({ error: 'You can only view your own transfers' });
    }

    if (user.role === 'base_commander' && 
        user.base_id !== transfer.from_base_id && 
        user.base_id !== transfer.to_base_id) {
      return res.status(403).json({ error: 'You can only view transfers involving your base' });
    }

    res.json(transfer);
  } catch (error) {
    console.error('Error fetching transfer details:', error);
    res.status(500).json({ error: 'Failed to fetch transfer details' });
  }
});

module.exports = router; 