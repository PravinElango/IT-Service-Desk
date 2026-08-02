const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

// Read master data (available to all authenticated users for ticket form creation)
router.get('/locations', masterController.getLocations);
router.get('/categories', masterController.getCategoriesAndSubOptions);

// Admin-only mutation routes
router.post('/locations', requireRole('super_admin'), masterController.createLocation);
router.put('/locations/:id', requireRole('super_admin'), masterController.updateLocation);
router.delete('/locations/:id', requireRole('super_admin'), masterController.deleteLocation);

router.post('/categories', requireRole('super_admin'), masterController.createCategory);
router.post('/categories/sub-options', requireRole('super_admin'), masterController.addSubOption);

module.exports = router;
