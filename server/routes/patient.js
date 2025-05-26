const express = require('express');
const bcrypt = require('bcrypt');
const Patient = require('../models/Patient');

const router = express.Router();

/**
 * POST /patient/register
 * ➤ Inscription d’un patient
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
 * ➤ Connexion d’un patient
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

module.exports = router;
