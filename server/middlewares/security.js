const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const sanitizeHtml = require("sanitize-html");
const express = require("express");
const logger = require("../utils/logger");
const { hmacFingerprint } = require("../utils/fingerprint");

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite à 100 requêtes par fenêtre
  message: {
    success: false,
    message: "Trop de requêtes. Veuillez réessayer plus tard.",
  },
});

// Limiter spécifiquement les tentatives de connexion
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // limite à 5 tentatives
  message: {
    success: false,
    message:
      "Trop de tentatives de connexion. Veuillez réessayer dans une heure.",
  },
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
      upgradeInsecureRequests:
        process.env.NODE_ENV === "production" ? [] : null,
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
    try {
      // Protection contre les attaques communes avec Helmet
      app.use(helmet(helmetConfig));

      // Parser JSON AVANT toute sanitisation
      app.use(express.json({ limit: "10kb" }));

      // Protection contre les injections XSS (remplacement de xss-clean)
      app.use((req, res, next) => {
        if (req.body && typeof req.body === "object") {
          for (const key in req.body) {
            if (typeof req.body[key] === "string") {
              req.body[key] = sanitizeHtml(req.body[key], {
                allowedTags: [],
                allowedAttributes: {},
              });
            }
          }
        }
        next();
      });

      // Protection contre les injections NoSQL (sanitisation maison)
      const sanitizeNoSQL = (obj) => {
        if (!obj || typeof obj !== "object") return obj;
        if (Array.isArray(obj)) return obj.map(sanitizeNoSQL);
        const clean = {};
        for (const [key, value] of Object.entries(obj)) {
          // Supprimer uniquement les clés qui commencent par '$' (conserve les points)
          if (key.startsWith("$")) continue;
          // Nettoyer récursivement
          clean[key] = typeof value === "object" ? sanitizeNoSQL(value) : value;
        }
        return clean;
      };

      app.use((req, res, next) => {
        if (req.body && typeof req.body === "object") {
          req.body = sanitizeNoSQL(req.body);
        }
        if (req.params && typeof req.params === "object") {
          req.params = sanitizeNoSQL(req.params);
        }
        // Ne pas réassigner req.query (getter en Express 5). On évite toute mutation risquée ici.
        next();
      });

  // Rate limiting global pour toutes les requêtes
      app.use(limiter);

      // Rate limiting plus strict pour les routes d'authentification
      app.use("/auth/login", authLimiter);
      app.use("/auth/register", authLimiter);
      app.use("/auth/reset-password", authLimiter);

      // Importer et utiliser le middleware de logging HTTP
      const httpLogger = require("./httpLogger");
      app.use(httpLogger());

      // Log de démarrage du middleware de sécurité
      logger.info("Middleware de sécurité configuré avec succès");
    } catch (error) {
      logger.error(
        { err: error },
        "Erreur lors de la configuration du middleware de sécurité"
      );
    }

    // Middleware pour loguer les requêtes de modification (POST, PUT, DELETE)
    app.use((req, res, next) => {
      // Utiliser le logger déjà attaché à la requête par httpLogger si disponible
      if (
        req.method === "POST" ||
        req.method === "PUT" ||
        req.method === "DELETE"
      ) {
        const securityLogger = logger.getSubLogger("security");

        const logData = {
          method: req.method,
          path: req.path,
          userAgent: req.get("User-Agent"),
          userId: req.user?.id || "anonymous",
          action: `${req.method} ${req.path}`,
        };

        // En production, anonymiser l'IP avec l'empreinte HMAC
        if (process.env.NODE_ENV === "production") {
          logData.ipFingerprint = hmacFingerprint(req.ip);
        } else {
          logData.ip = req.ip;
        }

        securityLogger.info(logData, "Action sensible");
      }
      next();
    });
  },
  validateInput,
  limiter,
  authLimiter,
  helmetConfig,
};
