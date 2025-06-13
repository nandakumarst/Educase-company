const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const baseRoutes = require('./routes/bases');
const maintenanceRoutes = require('./routes/maintenance');
const purchaseRoutes = require('./routes/purchases');
const transferRoutes = require('./routes/transfers');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', authenticateToken, assetRoutes);
app.use('/api/bases', authenticateToken, baseRoutes);
app.use('/api/maintenance', authenticateToken, maintenanceRoutes);
app.use('/api/purchases', authenticateToken, purchaseRoutes);
app.use('/api/transfers', authenticateToken, transferRoutes);

// Dashboard statistics endpoint
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  const { start_date, end_date, base_id } = req.query;
  
  try {
    // Get opening balance (assets at start date)
    const openingBalanceQuery = `
      SELECT COUNT(*) as count
      FROM assets a
      WHERE a.created_at <= ?
      ${base_id ? 'AND a.base_id = ?' : ''}
    `;
    
    // Get closing balance (assets at end date)
    const closingBalanceQuery = `
      SELECT COUNT(*) as count
      FROM assets a
      WHERE a.created_at <= ?
      ${base_id ? 'AND a.base_id = ?' : ''}
    `;
    
    // Get purchases
    const purchasesQuery = `
      SELECT COUNT(*) as count
      FROM purchases p
      WHERE p.purchase_date BETWEEN ? AND ?
      ${base_id ? 'AND p.base_id = ?' : ''}
    `;
    
    // Get transfers in
    const transfersInQuery = `
      SELECT COUNT(*) as count
      FROM transfers t
      WHERE t.transfer_date BETWEEN ? AND ?
      AND t.status = 'approved'
      ${base_id ? 'AND t.to_base_id = ?' : ''}
    `;
    
    // Get transfers out
    const transfersOutQuery = `
      SELECT COUNT(*) as count
      FROM transfers t
      WHERE t.transfer_date BETWEEN ? AND ?
      AND t.status = 'approved'
      ${base_id ? 'AND t.from_base_id = ?' : ''}
    `;
    
    // Get assigned assets
    const assignedAssetsQuery = `
      SELECT COUNT(*) as count
      FROM assets a
      WHERE a.status = 'assigned'
      ${base_id ? 'AND a.base_id = ?' : ''}
    `;
    
    // Get expended assets
    const expendedAssetsQuery = `
      SELECT COUNT(*) as count
      FROM assets a
      WHERE a.status = 'expended'
      ${base_id ? 'AND a.base_id = ?' : ''}
    `;

    const params = base_id ? [base_id] : [];
    const dateParams = [start_date, end_date, ...(base_id ? [base_id] : [])];

    const [
      openingBalance,
      closingBalance,
      purchases,
      transfersIn,
      transfersOut,
      assignedAssets,
      expendedAssets
    ] = await Promise.all([
      db.get(openingBalanceQuery, [start_date, ...params]),
      db.get(closingBalanceQuery, [end_date, ...params]),
      db.get(purchasesQuery, dateParams),
      db.get(transfersInQuery, dateParams),
      db.get(transfersOutQuery, dateParams),
      db.get(assignedAssetsQuery, params),
      db.get(expendedAssetsQuery, params)
    ]);

    res.json({
      opening_balance: openingBalance.count,
      closing_balance: closingBalance.count,
      net_movement: {
        purchases: purchases.count,
        transfers_in: transfersIn.count,
        transfers_out: transfersOut.count,
        total: purchases.count + transfersIn.count - transfersOut.count
      },
      assigned_assets: assignedAssets.count,
      expended_assets: expendedAssets.count
    });
  } catch (err) {
    console.error('Error fetching dashboard statistics:', err);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 