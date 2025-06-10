// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

// ✅ Enable CORS globally with preflight support
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));
app.options('*', cors());

app.use(express.json());

let db;
(async () => {
  db = await open({ filename: path.join(__dirname, 'user.db'), driver: sqlite3.Database });
  await db.run(`
    CREATE TABLE IF NOT EXISTS user (
      name TEXT PRIMARY KEY,
      number TEXT,
      email TEXT,
      company TEXT,
      password TEXT
    );
  `);
})();

const JWT_SECRET = process.env.JWT_SECRET || 'MY_SECRET_TOKEN';

app.post('/register', async (req, res) => {
  try {
    const { name, number, email, company, password } = req.body;
    if (!name || !number || !email || !password) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    const exists = await db.get('SELECT 1 FROM user WHERE name = ?', [name]);
    if (exists) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await db.run(
      `INSERT INTO user (name, number, email, company, password) VALUES (?, ?, ?, ?, ?)`,
      [name, number, email, company || '', hashed]
    );
    const token = jwt.sign({ name }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Registered successfully', token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    console.log('Login attempt for user:', name);
    
    if (!name || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await db.get('SELECT * FROM user WHERE name = ?', [name]);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword ? 'Yes' : 'No');
    
    if (!validPassword) {
      console.log('Invalid password');
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ name: user.name }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Login successful, token generated');
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Profile endpoint
app.get('/profile', verifyToken, async (req, res) => {
  try {
    console.log('Profile request for user:', req.user.name);
    const user = await db.get('SELECT name, email, number, company FROM user WHERE name = ?', [req.user.name]);
    
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Profile data retrieved successfully');
    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🟢 Server running at http://localhost:${PORT}`);
});
