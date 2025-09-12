const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const express = require('express');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite à 100 requêtes par fenêtre
  message: {
    success: false,
    message: "Trop de requêtes. Veuillez réessayer plus tard."
  }
});

// Limiter spécifiquement les tentatives de connexion
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // limite à 5 tentatives
  message: {
    success: false,
    message: "Trop de tentatives de connexion. Veuillez réessayer dans une heure."
  }
});

// Configuration Helmet (sécurité des headers HTTP)
// Avec une configuration CSP plus stricte et moderne
const helmetConfig = {
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      // Configuration moderne et stricte pour la sécurité
      defaultSrc: ["'self'"],
      // Scripts uniquement depuis le site lui-même et les CDN approuvés
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Requis pour certaines fonctionnalités React
        "https://cdn.jsdelivr.net", // Pour les bibliothèques CDN
      ],
      // Styles depuis le site et les sources approuvées
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Requis pour certains frameworks CSS
        "https://fonts.googleapis.com",
      ],
      // Images uniquement depuis sources approuvées
      imgSrc: [
        "'self'",
        "data:", // Pour les images encodées en base64
        "blob:", // Pour les images générées dynamiquement
        "https:", // Sources HTTPS approuvées
      ],
      // Connexions API et WebSocket
      connectSrc: [
        "'self'",
        process.env.BACKEND_URL || "http://localhost:5000",
        "https:", // Pour les API externes
        "wss:", // WebSocket sécurisé
        "ws:", // WebSocket
      ],
      // Polices depuis sources approuvées
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com",
        "data:", // Pour les icônes encodées
      ],
      objectSrc: ["'none'"], // Interdire les objets embarqués
      mediaSrc: ["'self'", "blob:", "data:"], // Media (son, vidéo)
      frameSrc: ["'none'"], // Interdire les iframes
      baseUri: ["'self'"], // Limiter les URI de base
      formAction: ["'self'"], // Limiter les actions de formulaires
      // Force HTTPS en production
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  // Politique d'intégration entre origines
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true,
  },
  // Autres protections
  noSniff: true,
  frameguard: { action: "deny" },
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  // Protection contre le clickjacking
  frameguard: { action: "deny" }, // X-Frame-Options: DENY
};

// Validation des entrées
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        details: error.details.map((detail) => detail.message),
      });
    }
    next();
  };
};

module.exports = {
  setupSecurity: (app) => {
    // Protection contre les attaques communes
    app.use(helmet(helmetConfig));
    app.use(xss());
    app.use(mongoSanitize());

    // Rate limiting global
    app.use(limiter);

    // Rate limiting spécifique pour l'auth
    app.use("/auth/login", authLimiter);
    app.use("/auth/register", authLimiter);

    // Middleware de logging sécurisé
    app.use((req, res, next) => {
      const logger = req.log || console;
      if (
        req.method === "POST" ||
        req.method === "PUT" ||
        req.method === "DELETE"
      ) {
        const logData = {
          method: req.method,
          path: req.path,
          userAgent: req.get("User-Agent"),
          timestamp: new Date().toISOString(),
        };

        // En production, ne pas logger l'IP directement
        if (process.env.NODE_ENV === "production") {
          const crypto = require("crypto");
          const hmacKey =
            process.env.LOG_HMAC_KEY || process.env.JWT_SECRET || "dev_key";
          logData.ipHash = crypto
            .createHmac("sha256", hmacKey)
            .update(req.ip)
            .digest("hex")
            .slice(0, 8);
        } else {
          logData.ip = req.ip;
        }

        logger.info
          ? logger.info(logData, "🔒 Security Log")
          : logger.log("🔒", logData);
      }
      next();
    });
  },
  validateInput,
  limiter,
  authLimiter,
  helmetConfig,
};
