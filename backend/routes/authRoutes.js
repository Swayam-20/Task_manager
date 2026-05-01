const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateProfile, getAllUsers, updateUserRole } = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { authValidators, validate } = require('../validators');

router.post('/signup', authValidators.signup, validate, signup);
router.post('/login',  authValidators.login,  validate, login);
router.get('/me',      authenticate, getMe);
router.patch('/me',    authenticate, updateProfile);
router.get('/users',   authenticate, getAllUsers);
router.patch('/users/:id/role', authenticate, requireAdmin, updateUserRole);

module.exports = router;