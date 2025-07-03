const express = require('express');
const bcrypt = require('bcrypt');
const Patient = require('../models/Patient');
const { authenticateRequired } = require('../middlewares/auth');
const Ticket = require('../models/Ticket');

const router = express.Router();

/**
 * POST /patient/register
 * ➤ Inscription d'un patient
 */
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const exists = await Patient.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Cet email existe déjà.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const patient = new Patient({ email, password: hashed });
    await patient.save();

    res.status(201).json({ message: 'Patient inscrit avec succès.' });
  } catch (err) {
    console.error('❌ Erreur /patient/register :', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/**
 * POST /patient/login
 * ➤ Connexion d'un patient
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(401).json({ message: 'Email introuvable.' });
    }

    const valid = await bcrypt.compare(password, patient.password);
    if (!valid) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    res.status(200).json({
      message: 'Connexion réussie',
      patientId: patient._id,
      email: patient.email
    });
  } catch (err) {
    console.error('❌ Erreur /patient/login :', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// 🎫 Récupérer le ticket actuel du patient connecté
router.get('/my-ticket', authenticateRequired, async (req, res) => {
  try {
    if (req.user.role.name !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux patients'
      });
    }

    const ticket = await Ticket.findOne({
      userId: req.user._id,
      status: { $in: ['en_attente', 'en_consultation'] }
    }).sort({ createdAt: -1 });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Aucun ticket actif trouvé'
      });
    }

    res.json({
      success: true,
      ticket
    });

  } catch (error) {
    console.error('❌ Erreur récupération ticket patient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du ticket'
    });
  }
});

module.exports = router;
