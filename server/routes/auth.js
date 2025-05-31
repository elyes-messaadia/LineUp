const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const router = express.Router();

/**
 * POST /auth/register
 * ➤ Inscription pour les visiteurs et patients
 */
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, roleName } = req.body;

    // Validation des champs obligatoires
    if (!firstName || !lastName || !email || !password || !roleName) {
      return res.status(400).json({ 
        message: 'Tous les champs obligatoires doivent être renseignés' 
      });
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Un compte avec cet email existe déjà' 
      });
    }

    // Vérifier que le rôle demandé est autorisé pour l'inscription
    if (!['patient', 'visiteur'].includes(roleName)) {
      return res.status(400).json({ 
        message: 'Seuls les comptes Patient et Visiteur peuvent être créés via l\'inscription' 
      });
    }

    // Récupérer le rôle depuis la base de données
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ 
        message: 'Rôle non trouvé' 
      });
    }

    // Hacher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone ? phone.trim() : undefined,
      role: role._id,
      isActive: true
    });

    await newUser.save();

    console.log(`✅ Nouvel utilisateur créé: ${email} (${roleName})`);

    res.status(201).json({ 
      message: 'Compte créé avec succès',
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: {
          name: role.name,
          permissions: role.permissions
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la création du compte' 
    });
  }
});

/**
 * POST /auth/login
 * ➤ Connexion pour tous les rôles
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email et mot de passe requis' 
      });
    }

    // Trouver l'utilisateur avec son rôle
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    }).populate('role');

    if (!user) {
      return res.status(401).json({ 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Générer le JWT
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions
      },
      process.env.JWT_SECRET || 'fallback_secret_change_in_production',
      { expiresIn: '24h' }
    );

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    console.log(`✅ Connexion réussie: ${email} (${user.role.name})`);

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        role: {
          name: user.role.name,
          permissions: user.role.permissions
        },
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la connexion' 
    });
  }
});

/**
 * POST /auth/verify
 * ➤ Vérifier la validité d'un token JWT
 */
router.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Token manquant' 
      });
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback_secret_change_in_production'
    );

    // Vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.userId).populate('role');
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'Utilisateur non trouvé ou inactif' 
      });
    }

    res.json({
      valid: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: {
          name: user.role.name,
          permissions: user.role.permissions
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du token:', error);
    res.status(401).json({ 
      message: 'Token invalide' 
    });
  }
});

/**
 * POST /auth/logout
 * ➤ Déconnexion (côté client surtout, mais peut servir pour logs)
 */
router.post('/logout', (req, res) => {
  // Dans un système JWT stateless, la déconnexion se fait côté client
  // Ici on peut juste logger l'événement
  console.log('👋 Déconnexion utilisateur');
  res.json({ 
    message: 'Déconnexion réussie' 
  });
});

module.exports = router; 