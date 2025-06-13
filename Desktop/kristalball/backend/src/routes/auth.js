const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../../database.sqlite'));

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get(
        'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = ?',
        [username],
        async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role_name,
                    base_id: user.base_id
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role_name,
                    base_id: user.base_id
                }
            });
        }
    );
});

// Register route (admin only)
router.post('/register', async (req, res) => {
    const { username, password, email, role_id, base_id } = req.body;

    if (!username || !password || !email || !role_id) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if username or email already exists
    db.get(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, email],
        async (err, existingUser) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (existingUser) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Insert new user
            db.run(
                'INSERT INTO users (username, password_hash, email, role_id, base_id) VALUES (?, ?, ?, ?, ?)',
                [username, passwordHash, email, role_id, base_id],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error creating user' });
                    }

                    res.status(201).json({
                        message: 'User created successfully',
                        userId: this.lastID
                    });
                }
            );
        }
    );
});

// Get user profile
router.get('/profile', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        db.get(
            'SELECT u.*, r.name as role_name, b.name as base_name FROM users u JOIN roles r ON u.role_id = r.id LEFT JOIN bases b ON u.base_id = b.id WHERE u.id = ?',
            [decoded.id],
            (err, user) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                res.json({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role_name,
                    base: user.base_name
                });
            }
        );
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router; 