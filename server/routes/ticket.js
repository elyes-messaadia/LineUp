const express = require('express');
const { authenticateOptional } = require('../middlewares/auth');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

// Créer un ticket
router.post('/', authenticateOptional, ticketController.createTicket);

// Lister les tickets du jour (ordre chronologique)
router.get('/', ticketController.getTickets);

// Mettre à jour le statut d'un ticket
router.patch('/:id/status', ticketController.updateTicketStatus);

// Supprimer un ticket
router.delete('/:id', authenticateOptional, ticketController.deleteTicket);

// Statistiques tickets (agrégations)
router.get('/stats', ticketController.getTicketStats);

module.exports = router;


