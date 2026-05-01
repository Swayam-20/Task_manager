const express = require('express');
const router = express.Router();
const {
    getProjects, getProject, createProject, updateProject,
    deleteProject, addMember, removeMember
} = require('../controllers/projectController');
const { authenticate, requireAdmin, requireProjectMember } = require('../middleware/auth');
const { projectValidators, validate } = require('../validators');

router.get('/',    authenticate, getProjects);
router.get('/:id', authenticate, requireProjectMember, getProject);
router.post('/',   authenticate, requireAdmin, projectValidators.create, validate, createProject);
router.put('/:id', authenticate, requireAdmin, projectValidators.update, validate, updateProject);
router.delete('/:id', authenticate, requireAdmin, deleteProject);
router.post('/:id/members',          authenticate, requireAdmin, addMember);
router.delete('/:id/members/:userId', authenticate, requireAdmin, removeMember);

module.exports = router;