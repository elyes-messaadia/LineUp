const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour vérifier l'authentification (optionnel)
const authenticateOptional = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'fallback_secret_change_in_production'
      );
      
      // Récupérer l'utilisateur complet avec son rôle
      const user = await User.findById(decoded.userId).populate('role');
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // En cas d'erreur, continuer sans utilisateur authentifié
    next();
  }
};

// Middleware pour vérifier l'authentification (obligatoire)
const authenticateRequired = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Token d\'authentification requis' 
      });
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback_secret_change_in_production'
    );
    
    // Récupérer l'utilisateur complet avec son rôle
    const user = await User.findById(decoded.userId).populate('role');
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'Utilisateur non trouvé ou inactif' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    return res.status(401).json({ 
      message: 'Token invalide' 
    });
  }
};

module.exports = {
  authenticateOptional,
  authenticateRequired
};
