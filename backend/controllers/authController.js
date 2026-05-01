const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const generateToken = (user) =>
    jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

const getInitials = (name) =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

// POST /api/auth/signup
const signup = async (req, res, next) => {
    try {
        const { name, email, password, role = 'member' } = req.body;

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const avatar = getInitials(name);

        const result = await pool.query(
            `INSERT INTO users (name, email, password, role, avatar)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, avatar, created_at`,
            [name, email, hashedPassword, role, avatar]
        );

        const user = result.rows[0];
        const token = generateToken(user);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user,
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (!result.rows.length) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = generateToken(user);
        const { password: _, ...safeUser } = user;

        res.json({ message: 'Login successful', token, user: safeUser });
    } catch (err) {
        next(err);
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    res.json({ user: req.user });
};

// PATCH /api/auth/me
const updateProfile = async (req, res, next) => {
    try {
        const { name, email } = req.body;
        const fields = [];
        const values = [];
        let idx = 1;

        if (name) { fields.push(`name = $${idx++}`); values.push(name); }
        if (email) { fields.push(`email = $${idx++}`); values.push(email); }
        fields.push(`updated_at = NOW()`);
        values.push(req.user.id);

        const result = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, role, avatar`,
            values
        );
        res.json({ user: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// GET /api/auth/users (admin only - for assignee dropdowns)
const getAllUsers = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, avatar FROM users ORDER BY name'
        );
        res.json({ users: result.rows });
    } catch (err) {
        next(err);
    }
};

// PATCH /api/auth/users/:id/role (admin only)
const updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!['admin', 'member'].includes(role)) {
            return res.status(400).json({ error: 'Role must be admin or member' });
        }
        if (+req.params.id === req.user.id) {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }
        const result = await pool.query(
            'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, avatar',
            [role, req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
        res.json({ user: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

module.exports = { signup, login, getMe, updateProfile, getAllUsers, updateUserRole };