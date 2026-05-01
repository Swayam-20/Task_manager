const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Verify JWT token
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
            'SELECT id, name, email, role, avatar FROM users WHERE id = $1',
            [decoded.id]
        );

        if (!result.rows.length) {
            return res.status(401).json({ error: 'User not found.' });
        }

        req.user = result.rows[0];
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

// Require admin role
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
};

// Check project membership
const requireProjectMember = async (req, res, next) => {
    try {
        const projectId = req.params.id || req.body.project_id;
        if (!projectId) return next();

        if (req.user.role === 'admin') return next();

        const result = await pool.query(
            'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
            [projectId, req.user.id]
        );

        if (!result.rows.length) {
            return res.status(403).json({ error: 'You are not a member of this project.' });
        }
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = { authenticate, requireAdmin, requireProjectMember };