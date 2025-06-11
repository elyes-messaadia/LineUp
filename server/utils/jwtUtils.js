const jwt = require('jsonwebtoken');

/**
 * Utilitaire JWT robuste pour gérer les problèmes de déploiement
 */

/**
 * Génère un token JWT
 * @param {Object} payload - Les données à encoder
 * @param {string} secret - Le secret JWT
 * @param {Object} options - Options JWT (expiresIn, etc.)
 * @returns {string} Le token JWT
 */
const generateToken = (payload, secret, options = {}) => {
  try {
    const defaultOptions = {
      expiresIn: '24h',
      issuer: 'lineup-app',
      ...options
    };
    
    return jwt.sign(payload, secret, defaultOptions);
  } catch (error) {
    console.error('❌ Erreur génération JWT:', error);
    throw new Error('Erreur génération token');
  }
};

/**
 * Vérifie un token JWT de manière robuste
 * @param {string} token - Le token à vérifier
 * @param {string} secret - Le secret JWT
 * @returns {Object} Le payload décodé
 */
const verifyToken = (token, secret) => {
  try {
    if (!token) {
      throw new Error('Token manquant');
    }

    if (!secret) {
      throw new Error('Secret JWT manquant');
    }

    // Nettoyage du token
    const cleanToken = token.trim();
    
    // Vérification basique du format JWT
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Format token invalide');
    }

    // Décodage et vérification
    const decoded = jwt.verify(cleanToken, secret, {
      issuer: 'lineup-app'
    });

    console.log(`✅ Token JWT vérifié avec succès pour userId: ${decoded.userId}`);
    return decoded;
    
  } catch (error) {
    console.error('❌ Erreur vérification JWT:', error.message);
    
    // Messages d'erreur plus clairs
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expiré');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token invalide');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token pas encore valide');
    } else {
      throw new Error('Erreur vérification token');
    }
  }
};

/**
 * Décode un token sans vérification (pour debug)
 * @param {string} token - Le token à décoder
 * @returns {Object} Le payload décodé
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    console.error('❌ Erreur décodage JWT:', error);
    return null;
  }
};

/**
 * Vérifie si un token est expiré sans lever d'erreur
 * @param {string} token - Le token à vérifier
 * @returns {boolean} true si expiré
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Extrait le token des headers de requête
 * @param {Object} headers - Headers de la requête
 * @returns {string|null} Le token ou null
 */
const extractTokenFromHeaders = (headers) => {
  const authHeader = headers.authorization || headers.Authorization;
  
  if (!authHeader) {
    return null;
  }
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
};

/**
 * Middleware d'authentification amélioré
 * @param {boolean} required - Si l'authentification est obligatoire
 * @returns {Function} Middleware Express
 */
const createAuthMiddleware = (required = false) => {
  return async (req, res, next) => {
    try {
      const token = extractTokenFromHeaders(req.headers);
      
      if (!token) {
        if (required) {
          return res.status(401).json({
            success: false,
            message: 'Token d\'authentification requis'
          });
        }
        return next(); // Optionnel : continuer sans utilisateur
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('❌ JWT_SECRET non configuré');
        if (required) {
          return res.status(500).json({
            success: false,
            message: 'Configuration serveur manquante'
          });
        }
        return next();
      }

      const decoded = verifyToken(token, jwtSecret);
      
      // Récupérer l'utilisateur de la base de données
      const User = require('../models/User');
      const user = await User.findById(decoded.userId).populate('role');
      
      if (!user || !user.isActive) {
        if (required) {
          return res.status(401).json({
            success: false,
            message: 'Utilisateur non trouvé ou inactif'
          });
        }
        return next();
      }

      req.user = user;
      req.token = token;
      req.tokenPayload = decoded;
      
      next();
      
    } catch (error) {
      console.error('❌ Erreur middleware auth:', error);
      
      if (required) {
        return res.status(401).json({
          success: false,
          message: error.message || 'Token invalide'
        });
      }
      
      // Si optionnel, continuer sans utilisateur
      next();
    }
  };
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  extractTokenFromHeaders,
  createAuthMiddleware
}; 