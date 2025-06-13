const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Get all bases
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bases = await db.all('SELECT * FROM bases');
    res.json(bases);
  } catch (error) {
    console.error('Error fetching bases:', error);
    res.status(500).json({ error: 'Failed to fetch bases' });
  }
});

// Get base by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const base = await db.get('SELECT * FROM bases WHERE id = ?', [id]);
    if (!base) {
      return res.status(404).json({ error: 'Base not found' });
    }
    res.json(base);
  } catch (error) {
    console.error('Error fetching base:', error);
    res.status(500).json({ error: 'Failed to fetch base' });
  }
});

// Create new base
router.post('/', authenticateToken, checkRole(['admin', 'base_commander']), async (req, res) => {
  try {
    const { name, location } = req.body;

    const result = await db.run('INSERT INTO bases (name, location) VALUES (?, ?)', [name, location]);

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
    `, [req.user.id, 'create', 'base', result.lastID, JSON.stringify(req.body)]);

    res.status(201).json({ id: result.lastID, message: 'Base created successfully' });
  } catch (error) {
    console.error('Error creating base:', error);
    res.status(500).json({ error: 'Failed to create base' });
  }
});

// Update base
router.put('/:id', authenticateToken, checkRole(['admin', 'base_commander']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    const result = await db.run('UPDATE bases SET name = ?, location = ? WHERE id = ?', [name, location, id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Base not found or no changes made' });
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
    `, [req.user.id, 'update', 'base', id, JSON.stringify(req.body)]);

    res.json({ message: 'Base updated successfully' });
  } catch (error) {
    console.error('Error updating base:', error);
    res.status(500).json({ error: 'Failed to update base' });
  }
});

// Delete base
router.delete('/:id', authenticateToken, checkRole(['admin', 'base_commander']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.run('DELETE FROM bases WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Base not found' });
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
    `, [req.user.id, 'delete', 'base', id, null, null]);

    res.json({ message: 'Base deleted successfully' });
  } catch (error) {
    console.error('Error deleting base:', error);
    res.status(500).json({ error: 'Failed to delete base' });
  }
});

// Get assets at a base (authenticated, all roles can view)
router.get('/:id/assets', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const assets = await db.all('SELECT * FROM assets WHERE base_id = ?', [id]);
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets at base:', error);
    res.status(500).json({ error: 'Failed to fetch assets at base' });
  }
});

module.exports = router; 