const express = require('express');
const { authenticateRequired } = require('../middlewares/auth');
const patientController = require('../controllers/patientController');

const router = express.Router();

/**
 * POST /patient/register
 * ➤ Inscription d'un patient
 */
router.post('/register', patientController.register);

/**
 * POST /patient/login
 * ➤ Connexion d'un patient
 */
router.post('/login', patientController.login);

// 🎫 Récupérer le ticket actuel du patient connecté
router.get('/my-ticket', authenticateRequired, patientController.getMyTicket);

module.exports = router;
