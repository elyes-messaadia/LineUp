const express = require('express');
const { authenticateRequired: authenticate } = require("../middlewares/auth");
const authController = require('../controllers/authController');
const webpush = require('web-push');

const router = express.Router();

// Configuration Web Push
webpush.setVapidDetails(
  'mailto:contact@lineup.app',
  process.env.VAPID_PUBLIC_KEY || 'BE6TTcnzxhHpEBQTomuclPw9snOauTKkweaL4HnnnatHhUjy_xk8xtMqDHVYhm9PolO19WIuE_M41U7yofhAPA0',
  process.env.VAPID_PRIVATE_KEY || 'TmybpfdcI33NeNluDq7JWiiLfeu4Q7PZWDR-hqIfn7s'
);

/**
 * POST /auth/register
 * ➤ Inscription pour les visiteurs et patients
 */
router.post('/register', authController.register);

/**
 * POST /auth/login
 * ➤ Connexion pour tous les rôles
 */
router.post('/login', authController.login);

/**
 * POST /auth/verify
 * ➤ Vérifier la validité d'un token JWT
 */
router.post('/verify', authController.verify);

/**
 * POST /auth/logout
 * ➤ Déconnexion (côté client surtout, mais peut servir pour logs)
 */
router.post('/logout', authController.logout);

// 🔔 S'abonner aux notifications push
router.post('/push/subscribe', authenticate, authController.pushSubscribe);

// 🔕 Se désabonner des notifications push  
router.post('/push/unsubscribe', authenticate, authController.pushUnsubscribe);

// 📤 Envoyer une notification push (endpoint interne)
router.post('/push/send', authenticate, authController.pushSend);

module.exports = router; 