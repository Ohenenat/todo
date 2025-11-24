const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, first_name, last_name, password } = req.body;
        
        // Check if username already exists
        const usernameExists = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (usernameExists.rows.length > 0) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Check if email already exists
        const emailExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailExists.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = await db.query(
            'INSERT INTO users (username, email, first_name, last_name, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, first_name, last_name',
            [username, email, first_name, last_name, hashedPassword]
        );

        // Create JWT token
        const token = jwt.sign({ 
            id: newUser.rows[0].id,
            username: newUser.rows[0].username,
            first_name: newUser.rows[0].first_name
        }, process.env.JWT_SECRET, {
            expiresIn: '24h'
        });

        // Set cookie with token
        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.status(201).json({
            id: newUser.rows[0].id,
            email: newUser.rows[0].email
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        const user = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Validate password
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Create JWT token
        const token = jwt.sign({ 
            id: user.rows[0].id,
            username: user.rows[0].username,
            first_name: user.rows[0].first_name
        }, process.env.JWT_SECRET, {
            expiresIn: '24h'
        });

        // Set cookie with token
        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            id: user.rows[0].id,
            username: user.rows[0].username,
            first_name: user.rows[0].first_name,
            last_name: user.rows[0].last_name
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logout user
router.post('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;