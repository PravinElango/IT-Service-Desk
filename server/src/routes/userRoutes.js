const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

// Get engineers list (accessible by Admin for assignment triage, or engineers)
router.get('/engineers', userController.getEngineers);

// Admin-only user management routes
router.get('/', requireRole('super_admin'), userController.getUsers);
router.post('/', requireRole('super_admin'), userController.createUser);
router.put('/:id', requireRole('super_admin'), userController.updateUser);
router.patch('/:id/toggle-status', requireRole('super_admin'), userController.toggleUserStatus);
router.delete('/:id', requireRole('super_admin'), userController.deleteUser);

module.exports = router;
