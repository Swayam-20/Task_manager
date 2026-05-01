const { body, param, query } = require('express-validator');

const authValidators = {
    signup: [
        body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
        body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('role')
            .optional()
            .isIn(['admin', 'member'])
            .withMessage('Role must be admin or member'),
    ],
    login: [
        body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
};

const projectValidators = {
    create: [
        body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 150 }),
        body('description').optional().trim().isLength({ max: 500 }),
        body('member_ids').optional().isArray().withMessage('member_ids must be an array'),
    ],
    update: [
        param('id').isInt().withMessage('Invalid project ID'),
        body('name').optional().trim().notEmpty().isLength({ max: 150 }),
        body('description').optional().trim().isLength({ max: 500 }),
    ],
};

const taskValidators = {
    create: [
        body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 200 }),
        body('description').optional().trim().isLength({ max: 1000 }),
        body('project_id').isInt({ min: 1 }).withMessage('Valid project ID required'),
        body('assignee_id').optional().isInt({ min: 1 }),
        body('status').optional().isIn(['todo', 'inprogress', 'done']),
        body('priority').optional().isIn(['low', 'medium', 'high']),
        body('due_date').optional().isDate().withMessage('Valid date required (YYYY-MM-DD)'),
    ],
    update: [
        param('id').isInt().withMessage('Invalid task ID'),
        body('title').optional().trim().notEmpty().isLength({ max: 200 }),
        body('description').optional().trim().isLength({ max: 1000 }),
        body('status').optional().isIn(['todo', 'inprogress', 'done']),
        body('priority').optional().isIn(['low', 'medium', 'high']),
        body('assignee_id').optional().isInt({ min: 1 }),
        body('due_date').optional().isDate(),
    ],
};

const validate = (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
    }
    next();
};

module.exports = { authValidators, projectValidators, taskValidators, validate };