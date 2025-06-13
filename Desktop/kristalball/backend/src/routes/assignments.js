const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Get all assignments with optional status filter
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const user = req.user;

    let query = `
      SELECT a.*, 
        ast.serial_number as asset_serial_number,
        ast.asset_type_name,
        p.rank as personnel_rank,
        p.name as personnel_name,
        p.unit as personnel_unit,
        u.username as assigned_by
      FROM assignments a
      JOIN assets ast ON a.asset_id = ast.id
      JOIN personnel p ON a.personnel_id = p.id
      JOIN users u ON a.assigned_by = u.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by status if provided
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    // Base commanders can only see assignments in their base
    if (user.role === 'base_commander') {
      query += ' AND a.base_id = ?';
      params.push(user.base_id);
    }

    // Regular users can only see assignments they created
    if (user.role === 'user') {
      query += ' AND a.assigned_by = ?';
      params.push(user.id);
    }

    query += ' ORDER BY a.created_at DESC';

    const assignments = await db.all(query, params);
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Create new assignment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      asset_id,
      personnel_id,
      assignment_date,
      purpose,
      expected_return_date
    } = req.body;

    const user = req.user;

    // Check if asset exists and is available
    const asset = await db.get('SELECT * FROM assets WHERE id = ?', [asset_id]);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (asset.status !== 'available') {
      return res.status(400).json({ error: 'Asset is not available for assignment' });
    }

    // Check if personnel exists
    const personnel = await db.get('SELECT * FROM personnel WHERE id = ?', [personnel_id]);
    if (!personnel) {
      return res.status(404).json({ error: 'Personnel not found' });
    }

    // Create assignment record
    const result = await db.run(`
      INSERT INTO assignments (
        asset_id,
        personnel_id,
        base_id,
        assignment_date,
        expected_return_date,
        purpose,
        status,
        assigned_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))
    `, [asset_id, personnel_id, asset.base_id, assignment_date, expected_return_date, purpose, user.id]);

    // Update asset status
    await db.run('UPDATE assets SET status = ? WHERE id = ?', ['assigned', asset_id]);

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
    `, [user.id, 'create', 'assignment', result.lastID, JSON.stringify(req.body)]);

    res.status(201).json({
      id: result.lastID,
      message: 'Assignment request created successfully'
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Update assignment status
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

    // Get assignment details
    const assignment = await db.get(`
      SELECT a.*, ast.status as asset_status
      FROM assignments a
      JOIN assets ast ON a.asset_id = ast.id
      WHERE a.id = ?
    `, [id]);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check permissions
    if (user.role === 'base_commander' && user.base_id !== assignment.base_id) {
      return res.status(403).json({ error: 'You can only update assignments in your base' });
    }

    // Update assignment status
    await db.run('UPDATE assignments SET status = ? WHERE id = ?', [status, id]);

    // Update asset status based on assignment status
    let assetStatus = assignment.asset_status;
    if (status === 'approved') {
      assetStatus = 'assigned';
    } else if (status === 'completed' || status === 'cancelled') {
      assetStatus = 'available';
    }

    await db.run('UPDATE assets SET status = ? WHERE id = ?', [assetStatus, assignment.asset_id]);

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
    `, [user.id, 'update_status', 'assignment', id, JSON.stringify({ status })]);

    res.json({ message: 'Assignment status updated successfully' });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ error: 'Failed to update assignment status' });
  }
});

// Get assignment details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const assignment = await db.get(`
      SELECT a.*, 
        ast.serial_number as asset_serial_number,
        ast.asset_type_name,
        p.rank as personnel_rank,
        p.name as personnel_name,
        p.unit as personnel_unit,
        u.username as assigned_by
      FROM assignments a
      JOIN assets ast ON a.asset_id = ast.id
      JOIN personnel p ON a.personnel_id = p.id
      JOIN users u ON a.assigned_by = u.id
      WHERE a.id = ?
    `, [id]);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check permissions
    if (user.role === 'user' && assignment.assigned_by !== user.id) {
      return res.status(403).json({ error: 'You can only view your own assignments' });
    }

    if (user.role === 'base_commander' && user.base_id !== assignment.base_id) {
      return res.status(403).json({ error: 'You can only view assignments in your base' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ error: 'Failed to fetch assignment details' });
  }
});

module.exports = router; 