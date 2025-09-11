const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, extractTokenFromHeaders, decodeToken } = require('../utils/jwtUtils');

// Middleware pour vérifier l'authentification (optionnel)
const authenticateOptional = async (req, res, next) => {
  try {
    const token = extractTokenFromHeaders(req.headers);

    if (token) {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        // En production, refuser l'utilisation si le secret n'est pas défini
        if (process.env.NODE_ENV === 'production') {
          console.error('JWT_SECRET non configuré en production');
          return next();
        }
      }

      try {
        const decoded = verifyToken(token, jwtSecret || 'fallback_secret_change_in_production');
        const user = await User.findById(decoded.userId).populate('role');
        if (user && user.isActive) {
          req.user = user;
          req.token = token;
          req.tokenPayload = decoded;
        }
      } catch (e) {
        // Ne pas révéler d'informations sur l'échec d'auth en logs en prod
        if (process.env.NODE_ENV === 'development') console.warn('authenticateOptional: token invalid');
      }
    }
    
    next();
  } catch (error) {
    console.error(`❌ authenticateOptional: Erreur d'authentification - ${error.message}`);
    
    // En cas d'erreur, essayer de décoder le token pour debug
    const token = extractTokenFromHeaders(req.headers);
    if (token) {
      const decodedInfo = decodeToken(token);
      console.log(`🔍 Debug token décodé:`, decodedInfo);
    }
    
    // En cas d'erreur, continuer sans utilisateur authentifié
    next();
  }
};

// Middleware pour vérifier l'authentification (obligatoire)
const authenticateRequired = async (req, res, next) => {
  try {
    const token = extractTokenFromHeaders(req.headers);
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token d\'authentification requis' 
      });
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Server misconfiguration' });
    }

    const decoded = verifyToken(token, jwtSecret || 'fallback_secret_change_in_production');
    
    // Récupérer l'utilisateur complet avec son rôle
    const user = await User.findById(decoded.userId).populate('role');
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non trouvé ou inactif' 
      });
    }
    
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    return res.status(401).json({ 
      success: false,
      message: error.message || 'Token invalide'
    });
  }
};

module.exports = {
  authenticateOptional,
  authenticateRequired
};
