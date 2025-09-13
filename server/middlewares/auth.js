const jwt = require("jsonwebtoken");
const User = require("../models/User");
const rateLimit = require("express-rate-limit");
const {
  verifyToken,
  extractTokenFromHeaders,
  decodeToken,
} = require("../utils/jwtUtils");

// Rate limiter pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives
  message: {
    success: false,
    message: "Trop de tentatives de connexion, veuillez réessayer plus tard",
  },
  skipSuccessfulRequests: true, // Ne pas compter les succès
});

// Nettoyer les informations sensibles de l'utilisateur
const sanitizeUser = (user) => {
  if (!user) return null;
  const sanitized = user.toObject();
  delete sanitized.password;
  delete sanitized.__v;
  delete sanitized.token;
  return sanitized;
};

// Middleware pour vérifier l'authentification (optionnel)
const authenticateOptional = async (req, res, next) => {
  try {
    const token = extractTokenFromHeaders(req.headers);

    if (token) {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        // En production, refuser l'utilisation si le secret n'est pas défini
        if (process.env.NODE_ENV === "production") {
          console.error("JWT_SECRET non configuré en production");
          return next();
        }
      }

      try {
        const decoded = verifyToken(
          token,
          jwtSecret || "fallback_secret_change_in_production"
        );
        const user = await User.findById(decoded.userId).populate("role");
        if (user && user.isActive) {
          req.user = user;
          req.token = token;
          req.tokenPayload = decoded;
        }
      } catch (e) {
        // Ne pas révéler d'informations sur l'échec d'auth en logs en prod
        if (process.env.NODE_ENV === "development")
          console.warn("authenticateOptional: token invalid");
      }
    }

    next();
  } catch (error) {
    console.error(
      `❌ authenticateOptional: Erreur d'authentification - ${error.message}`
    );

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
        message: "Token d'authentification requis",
      });
    }

    // Vérifier la configuration du secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret && process.env.NODE_ENV === "production") {
      return res
        .status(500)
        .json({ success: false, message: "Server misconfiguration" });
    }

    let decoded;
    try {
      decoded = verifyToken(
        token,
        jwtSecret || "fallback_secret_change_in_production"
      );
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Token invalide",
      });
    }

    // Vérifier l'expiration
    const now = Date.now() / 1000;
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({
        success: false,
        message: "Token expiré",
      });
    }

    try {
      // Récupérer l'utilisateur complet avec son rôle
      const user = await User.findById(decoded.userId)
        .populate("role")
        .select("-password -__v -token"); // Exclure les champs sensibles

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non trouvé ou inactif",
        });
      }

      // Vérifier les permissions du rôle si spécifiées
      if (req.requiredPermissions) {
        const hasPermissions = req.requiredPermissions.every((permission) =>
          user.role.permissions.includes(permission)
        );
        if (!hasPermissions) {
          return res.status(403).json({
            success: false,
            message: "Permissions insuffisantes",
          });
        }
      }

      req.user = sanitizeUser(user);
      req.token = token;
      req.tokenPayload = decoded;
      
      // Nettoyer les headers sensibles
      delete req.headers["x-powered-by"];
      delete req.headers["server"];
      
      next();
    } catch (dbError) {
      console.error("❌ Erreur base de données:", dbError);
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  } catch (error) {
    console.error("❌ Erreur authentification:", error);
    return res.status(401).json({
      success: false,
      message: error.message || "Token invalide",
    });
  }
};

module.exports = {
  authenticateOptional,
  authenticateRequired,
  // Middleware attendu par certaines routes/tests: alias explicite
  authenticateToken: async (req, res, next) => {
    try {
      const token = extractTokenFromHeaders(req.headers);
      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: "Token manquant" });
      }
      const jwtSecret =
        process.env.JWT_SECRET || "fallback_secret_change_in_production";
      let decoded;
      try {
        decoded = verifyToken(token, jwtSecret);
      } catch (e) {
        return res
          .status(401)
          .json({ success: false, message: "Token invalide" });
      }
      const user = await User.findById(decoded.userId)
        .select("-password -__v")
        .populate("role");
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Utilisateur non trouvé" });
      }
      req.user = user;
      req.token = token;
      req.tokenPayload = decoded;
      next();
    } catch (error) {
      console.error("❌ authenticateToken error:", error);
      return res
        .status(401)
        .json({ success: false, message: "Token invalide" });
    }
  },
};
