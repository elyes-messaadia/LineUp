// routes/admin.js
const express = require('express');
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');

const router = express.Router();

// POST /admin/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifie si l'admin existe déjà
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Cet email existe déjà.' });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'admin
    const admin = new Admin({ email, password: hashedPassword });
    await admin.save();

    res.status(201).json({ message: 'Admin créé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Route de connexion
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const admin = await Admin.findOne({ email });
  
      if (!admin) {
        return res.status(401).json({ message: "Email invalide." });
      }
  
      const valid = await bcrypt.compare(password, admin.password);
  
      if (!valid) {
        return res.status(401).json({ message: "Mot de passe incorrect." });
      }
  
      res.status(200).json({ message: "Connexion réussie", adminId: admin._id });
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur." });
    }
  });
  

module.exports = router;
