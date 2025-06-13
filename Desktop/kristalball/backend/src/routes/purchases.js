const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all purchases with filters
router.get('/', (req, res) => {
  const { start_date, end_date, base_id, asset_type } = req.query;
  let query = `
    SELECT p.*, a.name as asset_name, a.type as asset_type, b.name as base_name
    FROM purchases p
    JOIN assets a ON p.asset_id = a.id
    JOIN bases b ON p.base_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    query += ' AND p.purchase_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND p.purchase_date <= ?';
    params.push(end_date);
  }
  if (base_id) {
    query += ' AND p.base_id = ?';
    params.push(base_id);
  }
  if (asset_type) {
    query += ' AND a.type = ?';
    params.push(asset_type);
  }

  query += ' ORDER BY p.purchase_date DESC';

  db.all(query, params, (err, purchases) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching purchases' });
    }
    res.json(purchases);
  });
});

// Get purchase by ID
router.get('/:id', (req, res) => {
  db.get(`
    SELECT p.*, a.name as asset_name, a.type as asset_type, b.name as base_name
    FROM purchases p
    JOIN assets a ON p.asset_id = a.id
    JOIN bases b ON p.base_id = b.id
    WHERE p.id = ?
  `, [req.params.id], (err, purchase) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching purchase' });
    }
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(purchase);
  });
});

// Create new purchase
router.post('/', (req, res) => {
  const {
    asset_id,
    base_id,
    quantity,
    unit_price,
    total_price,
    purchase_date,
    supplier,
    status
  } = req.body;

  db.run(
    `INSERT INTO purchases (
      asset_id, base_id, quantity, unit_price, total_price,
      purchase_date, supplier, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [asset_id, base_id, quantity, unit_price, total_price, purchase_date, supplier, status],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error creating purchase' });
      }
      
      res.status(201).json({
        message: 'Purchase created successfully',
        purchaseId: this.lastID
      });
    }
  );
});

// Update purchase
router.put('/:id', (req, res) => {
  const {
    asset_id,
    base_id,
    quantity,
    unit_price,
    total_price,
    purchase_date,
    supplier,
    status
  } = req.body;

  db.run(
    `UPDATE purchases SET
      asset_id = ?, base_id = ?, quantity = ?, unit_price = ?,
      total_price = ?, purchase_date = ?, supplier = ?, status = ?
    WHERE id = ?`,
    [asset_id, base_id, quantity, unit_price, total_price, purchase_date, supplier, status, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating purchase' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Purchase not found' });
      }
      res.json({ message: 'Purchase updated successfully' });
    }
  );
});

// Delete purchase
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM purchases WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting purchase' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json({ message: 'Purchase deleted successfully' });
  });
});

// Get purchase statistics
router.get('/stats/summary', (req, res) => {
  const { start_date, end_date, base_id } = req.query;
  let query = `
    SELECT 
      COUNT(*) as total_purchases,
      SUM(quantity) as total_quantity,
      SUM(total_price) as total_cost,
      AVG(unit_price) as avg_unit_price
    FROM purchases p
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    query += ' AND p.purchase_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND p.purchase_date <= ?';
    params.push(end_date);
  }
  if (base_id) {
    query += ' AND p.base_id = ?';
    params.push(base_id);
  }

  db.get(query, params, (err, stats) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching purchase statistics' });
    }
    res.json(stats);
  });
});

module.exports = router; 