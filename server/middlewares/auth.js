const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, extractTokenFromHeaders, decodeToken } = require('../utils/jwtUtils');

// Middleware pour vérifier l'authentification (optionnel)
const authenticateOptional = async (req, res, next) => {
  try {
    const token = extractTokenFromHeaders(req.headers);
    
    if (token) {
      console.log(`🔐 authenticateOptional: Token reçu - ${token.substring(0, 20)}...`);
      
      const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
      if (!process.env.JWT_SECRET) {
        console.warn('⚠️ JWT_SECRET manquant - Utilisation du fallback');
      }
      
      console.log(`🔐 authenticateOptional: Décodage JWT avec secret...`);
      
      // Utiliser notre utilitaire robuste
      const decoded = verifyToken(token, jwtSecret);
      console.log(`🔐 authenticateOptional: Token décodé - userId: ${decoded.userId}`);
      
      // Récupérer l'utilisateur complet avec son rôle
      const user = await User.findById(decoded.userId).populate('role');
      console.log(`🔐 authenticateOptional: Utilisateur trouvé - ${user ? user.email : 'AUCUN'}`);
      console.log(`🔐 authenticateOptional: Utilisateur actif - ${user ? user.isActive : 'N/A'}`);
      
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
        req.tokenPayload = decoded;
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

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️ JWT_SECRET manquant - Utilisation du fallback');
    }
    
    const decoded = verifyToken(token, jwtSecret);
    
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
