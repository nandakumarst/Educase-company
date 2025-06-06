const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: 'https://nandakumarst.github.io',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const databasePath = path.join(__dirname, 'user.db');
const JWT_SECRET = 'MY_SECRET_TOKEN';
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({ filename: databasePath, driver: sqlite3.Database });
    await database.run(`
      CREATE TABLE IF NOT EXISTS user (
        name TEXT UNIQUE,
        number TEXT,
        email TEXT,
        company TEXT,
        password TEXT
      )
    `);
    app.listen(3001, () => console.log('Server running at http://localhost:3001/'));
  } catch (e) {
    console.error('Database initialization error:', e.message);
    process.exit(1);
  }
};

initializeDbAndServer();

const validatePassword = (password) => password.length > 4;

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Missing JWT Token' });

    jwt.verify(token, JWT_SECRET, (err, payload) => {
      if (err) return res.status(401).json({ error: 'Invalid JWT Token' });
      req.username = payload.name;
      next();
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

app.post('/register', async (req, res) => {
  try {
    const { name, number, email, company, password } = req.body;
    
    if (!name || !number || !email || !company || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 5 characters long' });
    }

    const existingUser = await database.get('SELECT * FROM user WHERE name = ?', [name]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await database.run(
      'INSERT INTO user (name, number, email, company, password) VALUES (?, ?, ?, ?, ?)',
      [name, number, email, company, hashedPassword]
    );
    
    const token = jwt.sign({ name }, JWT_SECRET);
    res.json({ message: 'User created successfully', token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await database.get('SELECT * FROM user WHERE name = ?', [name]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ name }, JWT_SECRET);
    res.json({ message: 'Login success!', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const name = req.username;
    const userDetails = await database.get(
      'SELECT name, number, email, company FROM user WHERE name = ?',
      [name]
    );
    
    if (!userDetails) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(userDetails);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;
