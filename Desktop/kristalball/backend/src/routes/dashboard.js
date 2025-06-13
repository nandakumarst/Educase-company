const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../../database.sqlite'));

// Get dashboard metrics
router.get('/metrics', (req, res) => {
    const { base_id, start_date, end_date, status } = req.query;
    const user = req.user;

    // Base query conditions based on user role
    let baseCondition = '';
    let params = [];

    if (user.role === 'base_commander') {
        baseCondition = 'WHERE a.base_id = ?';
        params.push(user.base_id);
    } else if (user.role === 'logistics_officer') {
        baseCondition = 'WHERE a.base_id = ?';
        params.push(user.base_id);
    }

    if (start_date && end_date) {
        baseCondition += baseCondition ? ' AND' : 'WHERE';
        baseCondition += ' a.created_at BETWEEN ? AND ?';
        params.push(start_date, end_date);
    }

    if (status) {
        baseCondition += baseCondition ? ' AND' : 'WHERE';
        baseCondition += ' a.status = ?';
        params.push(status);
    }

    // Get opening balance (assets at start of period)
    const openingBalanceQuery = `
        SELECT COUNT(*) as count
        FROM assets a
        ${baseCondition}
        AND a.created_at < ?
    `;

    // Get closing balance (assets at end of period)
    const closingBalanceQuery = `
        SELECT COUNT(*) as count
        FROM assets a
        ${baseCondition}
        AND a.created_at <= ?
    `;

    // Get purchases
    const purchasesQuery = `
        SELECT COUNT(*) as count
        FROM purchases p
        ${baseCondition}
        AND p.purchase_date BETWEEN ? AND ?
        ${status ? 'AND p.status = ?' : 'AND p.status = "completed"'}
    `;

    // Get transfers in
    const transfersInQuery = `
        SELECT COUNT(*) as count
        FROM transfers t
        JOIN assets a ON t.asset_id = a.id
        ${baseCondition}
        AND t.transfer_date BETWEEN ? AND ?
        ${status ? 'AND t.status = ?' : 'AND t.status = "completed"'}
        AND t.to_base_id = a.base_id
    `;

    // Get transfers out
    const transfersOutQuery = `
        SELECT COUNT(*) as count
        FROM transfers t
        JOIN assets a ON t.asset_id = a.id
        ${baseCondition}
        AND t.transfer_date BETWEEN ? AND ?
        ${status ? 'AND t.status = ?' : 'AND t.status = "completed"'}
        AND t.from_base_id = a.base_id
    `;

    // Get assigned assets
    const assignedQuery = `
        SELECT COUNT(*) as count
        FROM assignments a
        ${baseCondition}
        ${status ? 'AND a.status = ?' : 'AND a.status = "active"'}
    `;

    // Get expended assets
    const expendedQuery = `
        SELECT COUNT(*) as count
        FROM expenditures e
        JOIN assets a ON e.asset_id = a.id
        ${baseCondition}
        AND e.expenditure_date BETWEEN ? AND ?
    `;

    // Execute all queries
    Promise.all([
        new Promise((resolve, reject) => {
            db.get(openingBalanceQuery, [...params, start_date], (err, result) => {
                if (err) reject(err);
                else resolve(result?.count || 0);
            });
        }),
        new Promise((resolve, reject) => {
            db.get(closingBalanceQuery, [...params, end_date], (err, result) => {
                if (err) reject(err);
                else resolve(result?.count || 0);
            });
        }),
        new Promise((resolve, reject) => {
            const purchaseParams = [...params, start_date, end_date];
            if (status) purchaseParams.push(status);
            db.get(purchasesQuery, purchaseParams, (err, result) => {
                if (err) reject(err);
                else resolve(result?.count || 0);
            });
        }),
        new Promise((resolve, reject) => {
            const transferInParams = [...params, start_date, end_date];
            if (status) transferInParams.push(status);
            db.get(transfersInQuery, transferInParams, (err, result) => {
                if (err) reject(err);
                else resolve(result?.count || 0);
            });
        }),
        new Promise((resolve, reject) => {
            const transferOutParams = [...params, start_date, end_date];
            if (status) transferOutParams.push(status);
            db.get(transfersOutQuery, transferOutParams, (err, result) => {
                if (err) reject(err);
                else resolve(result?.count || 0);
            });
        }),
        new Promise((resolve, reject) => {
            const assignedParams = [...params];
            if (status) assignedParams.push(status);
            db.get(assignedQuery, assignedParams, (err, result) => {
                if (err) reject(err);
                else resolve(result?.count || 0);
            });
        }),
        new Promise((resolve, reject) => {
            db.get(expendedQuery, [...params, start_date, end_date], (err, result) => {
                if (err) reject(err);
                else resolve(result?.count || 0);
            });
        })
    ])
    .then(([openingBalance, closingBalance, purchases, transfersIn, transfersOut, assigned, expended]) => {
        const netMovement = purchases + transfersIn - transfersOut;

        res.json({
            opening_balance: openingBalance,
            closing_balance: closingBalance,
            net_movement: netMovement,
            purchases,
            transfers_in: transfersIn,
            transfers_out: transfersOut,
            assigned,
            expended
        });
    })
    .catch(err => {
        console.error('Error fetching dashboard metrics:', err);
        res.status(500).json({ error: 'Error fetching dashboard metrics' });
    });
});

// Get recent activities
router.get('/activities', (req, res) => {
    const { limit = 10, status } = req.query;
    const user = req.user;

    let baseCondition = '';
    let params = [];

    if (user.role === 'base_commander' || user.role === 'logistics_officer') {
        baseCondition = 'WHERE a.base_id = ?';
        params.push(user.base_id);
    }

    if (status) {
        baseCondition += baseCondition ? ' AND' : 'WHERE';
        baseCondition += ' status = ?';
        params.push(status);
    }

    const query = `
        SELECT 
            'purchase' as type,
            p.created_at as timestamp,
            p.quantity as quantity,
            at.name as asset_type,
            b.name as base_name,
            p.status as status
        FROM purchases p
        JOIN asset_types at ON p.asset_type_id = at.id
        JOIN bases b ON p.base_id = b.id
        ${baseCondition}
        UNION ALL
        SELECT 
            'transfer' as type,
            t.created_at as timestamp,
            1 as quantity,
            at.name as asset_type,
            b.name as base_name,
            t.status as status
        FROM transfers t
        JOIN assets a ON t.asset_id = a.id
        JOIN asset_types at ON a.asset_type_id = at.id
        JOIN bases b ON t.from_base_id = b.id
        ${baseCondition}
        UNION ALL
        SELECT 
            'assignment' as type,
            a.created_at as timestamp,
            1 as quantity,
            at.name as asset_type,
            b.name as base_name,
            a.status as status
        FROM assignments a
        JOIN assets ast ON a.asset_id = ast.id
        JOIN asset_types at ON ast.asset_type_id = at.id
        JOIN bases b ON a.base_id = b.id
        ${baseCondition}
        ORDER BY timestamp DESC
        LIMIT ?
    `;

    db.all(query, [...params, limit], (err, activities) => {
        if (err) {
            console.error('Error fetching activities:', err);
            return res.status(500).json({ error: 'Error fetching activities' });
        }

        res.json(activities);
    });
});

// Get asset type distribution
router.get('/asset-distribution', (req, res) => {
    const user = req.user;

    let baseCondition = '';
    let params = [];

    if (user.role === 'base_commander' || user.role === 'logistics_officer') {
        baseCondition = 'WHERE a.base_id = ?';
        params.push(user.base_id);
    }

    const query = `
        SELECT 
            at.name as asset_type,
            COUNT(*) as count
        FROM assets a
        JOIN asset_types at ON a.asset_type_id = at.id
        ${baseCondition}
        GROUP BY at.name
        ORDER BY count DESC
    `;

    db.all(query, params, (err, distribution) => {
        if (err) {
            console.error('Error fetching asset distribution:', err);
            return res.status(500).json({ error: 'Error fetching asset distribution' });
        }

        res.json(distribution);
    });
});

module.exports = router; 