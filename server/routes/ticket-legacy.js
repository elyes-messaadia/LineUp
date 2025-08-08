const express = require('express');
const { authenticateOptional } = require('../middlewares/auth');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

// Endpoint historique de création avancée
router.post('/ticket', authenticateOptional, ticketController.createTicketAdvanced);

// Vérifier l'existence d'un ticket
router.get('/ticket/:id', ticketController.getTicketById);

// File d'attente
router.get('/queue', ticketController.getQueue);

// Statistiques d'abus (admin)
router.get('/admin/abuse-stats', authenticateOptional, ticketController.getAbuseStats);

// Annuler (désister) un ticket avec sécurité
router.delete('/ticket/:id', authenticateOptional, ticketController.deleteTicketSecure);

// Reprendre un ticket désisté
router.patch('/ticket/:id/resume', ticketController.resumeTicket);

// Appeler le prochain patient pour un docteur
router.delete('/next', ticketController.callNextForDoctor);

// Appeler un ticket spécifique en consultation
router.patch('/ticket/:id/call', ticketController.callTicket);

// Marquer un ticket comme terminé
router.patch('/ticket/:id/finish', ticketController.finishTicket);

// Statistiques globales ou par docteur
router.get('/stats', ticketController.getStats);

module.exports = router;


