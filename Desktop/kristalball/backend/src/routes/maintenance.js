const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all maintenance records
router.get('/', (req, res) => {
  db.all(`
    SELECT m.*, a.name as asset_name, a.serial_number
    FROM maintenance m
    JOIN assets a ON m.asset_id = a.id
    ORDER BY m.date DESC
  `, [], (err, records) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching maintenance records' });
    }
    res.json(records);
  });
});

// Get maintenance record by ID
router.get('/:id', (req, res) => {
  db.get(`
    SELECT m.*, a.name as asset_name, a.serial_number
    FROM maintenance m
    JOIN assets a ON m.asset_id = a.id
    WHERE m.id = ?
  `, [req.params.id], (err, record) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching maintenance record' });
    }
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    res.json(record);
  });
});

// Create new maintenance record
router.post('/', (req, res) => {
  const { asset_id, date, type, description, cost, technician } = req.body;
  
  db.run(
    'INSERT INTO maintenance (asset_id, date, type, description, cost, technician) VALUES (?, ?, ?, ?, ?, ?)',
    [asset_id, date, type, description, cost, technician],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error creating maintenance record' });
      }
      
      res.status(201).json({
        message: 'Maintenance record created successfully',
        recordId: this.lastID
      });
    }
  );
});

// Update maintenance record
router.put('/:id', (req, res) => {
  const { asset_id, date, type, description, cost, technician } = req.body;
  
  db.run(
    'UPDATE maintenance SET asset_id = ?, date = ?, type = ?, description = ?, cost = ?, technician = ? WHERE id = ?',
    [asset_id, date, type, description, cost, technician, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating maintenance record' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Maintenance record not found' });
      }
      res.json({ message: 'Maintenance record updated successfully' });
    }
  );
});

// Delete maintenance record
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM maintenance WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting maintenance record' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    res.json({ message: 'Maintenance record deleted successfully' });
  });
});

// Get maintenance records for an asset
router.get('/asset/:assetId', (req, res) => {
  db.all(`
    SELECT m.*, a.name as asset_name, a.serial_number
    FROM maintenance m
    JOIN assets a ON m.asset_id = a.id
    WHERE m.asset_id = ?
    ORDER BY m.date DESC
  `, [req.params.assetId], (err, records) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching asset maintenance records' });
    }
    res.json(records);
  });
});

module.exports = router; 