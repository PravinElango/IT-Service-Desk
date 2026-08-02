const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const upload = require('../middleware/upload');

router.use(authenticateToken);

// List tickets (scoped by role automatically)
router.get('/', ticketController.getTickets);

// Get single ticket details
router.get('/:id', ticketController.getTicketById);

// Create new ticket (Clients and Admins) with optional attachments
router.post('/', requireRole('client', 'super_admin'), upload.array('attachments', 5), ticketController.createTicket);

// Assign engineer (Admin only)
router.patch('/:id/assign', requireRole('super_admin'), ticketController.assignEngineer);

// Update status (e.g. In Progress)
router.patch('/:id/status', requireRole('engineer', 'super_admin'), ticketController.updateStatus);

// Resolve ticket (Engineer / Admin with mandatory resolution notes)
router.post('/:id/resolve', requireRole('engineer', 'super_admin'), ticketController.resolveTicket);

// Reopen ticket (Client / Admin)
router.post('/:id/reopen', requireRole('client', 'super_admin'), ticketController.reopenTicket);

// Add comment to ticket
router.post('/:id/comments', ticketController.addComment);

module.exports = router;
