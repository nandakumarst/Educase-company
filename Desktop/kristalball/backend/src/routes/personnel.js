const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Get all personnel
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let query = 'SELECT p.*, b.name as base_name FROM personnel p JOIN bases b ON p.base_id = b.id';
    const params = [];

    // Base commanders can only see personnel in their base
    if (user.role === 'base_commander') {
      query += ' WHERE p.base_id = ?';
      params.push(user.base_id);
    }

    const personnel = await db.all(query, params);
    res.json(personnel);
  } catch (error) {
    console.error('Error fetching personnel:', error);
    res.status(500).json({ error: 'Failed to fetch personnel' });
  }
});

// Get personnel by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const personnel = await db.get('SELECT p.*, b.name as base_name FROM personnel p JOIN bases b ON p.base_id = b.id WHERE p.id = ?', [id]);

    if (!personnel) {
      return res.status(404).json({ error: 'Personnel not found' });
    }

    // Base commanders can only see personnel in their base
    if (user.role === 'base_commander' && user.base_id !== personnel.base_id) {
      return res.status(403).json({ error: 'You can only view personnel in your base' });
    }

    res.json(personnel);
  } catch (error) {
    console.error('Error fetching personnel details:', error);
    res.status(500).json({ error: 'Failed to fetch personnel details' });
  }
});

// Create new personnel
router.post('/', authenticateToken, checkRole(['admin', 'base_commander']), async (req, res) => {
  try {
    const { name, rank, unit, base_id } = req.body;

    // Validate base_id if user is base_commander
    const user = req.user;
    if (user.role === 'base_commander' && user.base_id !== base_id) {
      return res.status(403).json({ error: 'You can only add personnel to your assigned base' });
    }

    const result = await db.run('INSERT INTO personnel (name, rank, unit, base_id) VALUES (?, ?, ?, ?)', [name, rank, unit, base_id]);

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
    `, [user.id, 'create', 'personnel', result.lastID, JSON.stringify(req.body)]);

    res.status(201).json({ id: result.lastID, message: 'Personnel added successfully' });
  } catch (error) {
    console.error('Error adding personnel:', error);
    res.status(500).json({ error: 'Failed to add personnel' });
  }
});

// Update personnel
router.put('/:id', authenticateToken, checkRole(['admin', 'base_commander']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rank, unit, base_id } = req.body;
    const user = req.user;

    // Get existing personnel to check base_id
    const existingPersonnel = await db.get('SELECT * FROM personnel WHERE id = ?', [id]);
    if (!existingPersonnel) {
      return res.status(404).json({ error: 'Personnel not found' });
    }

    // Validate base_id if user is base_commander
    if (user.role === 'base_commander' && user.base_id !== existingPersonnel.base_id) {
      return res.status(403).json({ error: 'You can only update personnel in your assigned base' });
    }

    const result = await db.run('UPDATE personnel SET name = ?, rank = ?, unit = ?, base_id = ? WHERE id = ?', [name, rank, unit, base_id, id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Personnel not found or no changes made' });
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
    `, [user.id, 'update', 'personnel', id, JSON.stringify(req.body)]);

    res.json({ message: 'Personnel updated successfully' });
  } catch (error) {
    console.error('Error updating personnel:', error);
    res.status(500).json({ error: 'Failed to update personnel' });
  }
});

// Delete personnel
router.delete('/:id', authenticateToken, checkRole(['admin', 'base_commander']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Get existing personnel to check base_id
    const existingPersonnel = await db.get('SELECT * FROM personnel WHERE id = ?', [id]);
    if (!existingPersonnel) {
      return res.status(404).json({ error: 'Personnel not found' });
    }

    // Validate base_id if user is base_commander
    if (user.role === 'base_commander' && user.base_id !== existingPersonnel.base_id) {
      return res.status(403).json({ error: 'You can only delete personnel from your assigned base' });
    }

    const result = await db.run('DELETE FROM personnel WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Personnel not found' });
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
    `, [user.id, 'delete', 'personnel', id, null, null]);

    res.json({ message: 'Personnel deleted successfully' });
  } catch (error) {
    console.error('Error deleting personnel:', error);
    res.status(500).json({ error: 'Failed to delete personnel' });
  }
});

module.exports = router; 