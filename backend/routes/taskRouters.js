const express = require('express');
const router = express.Router();
const {
    getTasks, getTask, createTask, updateTask, deleteTask, getDashboardStats
} = require('../controllers/taskController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { taskValidators, validate } = require('../validators');

router.get('/dashboard', authenticate, getDashboardStats);
router.get('/',          authenticate, getTasks);
router.get('/:id',       authenticate, getTask);
router.post('/',         authenticate, taskValidators.create, validate, createTask);
router.put('/:id',       authenticate, taskValidators.update, validate, updateTask);
router.delete('/:id',    authenticate, requireAdmin, deleteTask);

module.exports = router;