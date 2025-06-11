const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour vérifier l'authentification (optionnel)
const authenticateOptional = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      console.log(`🔐 authenticateOptional: Token reçu - ${token.substring(0, 20)}...`);
      
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('❌ JWT_SECRET manquant - Arrêt du serveur');
        throw new Error('JWT_SECRET non configuré');
      }
      
      console.log(`🔐 authenticateOptional: Décodage JWT avec secret...`);
      const decoded = jwt.verify(token, jwtSecret);
      console.log(`🔐 authenticateOptional: Token décodé - userId: ${decoded.userId}`);
      
      // Récupérer l'utilisateur complet avec son rôle
      const user = await User.findById(decoded.userId).populate('role');
      console.log(`🔐 authenticateOptional: Utilisateur trouvé - ${user ? user.email : 'AUCUN'}`);
      console.log(`🔐 authenticateOptional: Utilisateur actif - ${user ? user.isActive : 'N/A'}`);
      
      if (user && user.isActive) {
        req.user = user;
        console.log(`✅ authenticateOptional: Authentification réussie - ${user.email} (${user.role.name})`);
      } else {
        console.log(`❌ authenticateOptional: Utilisateur non trouvé ou inactif`);
      }
    } else {
      console.log(`🔐 authenticateOptional: Aucun token fourni`);
    }
    
    next();
  } catch (error) {
    console.error(`❌ authenticateOptional: Erreur d'authentification - ${error.message}`);
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

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET manquant');
      return res.status(500).json({ 
        message: 'Configuration serveur manquante' 
      });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    
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
