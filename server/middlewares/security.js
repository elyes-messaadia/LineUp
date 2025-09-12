const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite à 100 requêtes par fenêtre
});

// Limiter spécifiquement les tentatives de connexion
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // limite à 5 tentatives
  message:
    "Trop de tentatives de connexion. Veuillez réessayer dans une heure.",
});

// Configuration Helmet (sécurité des headers HTTP)
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https:",
        "https://fonts.googleapis.com",
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.jsdelivr.net",
      ],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        process.env.BACKEND_URL || "'self'",
        "https:",
        "wss:",
        "ws:",
      ],
      fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests:
        process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: "deny" },
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
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
