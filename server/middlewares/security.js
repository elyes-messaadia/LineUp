const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite à 100 requêtes par fenêtre
});

// Limiter spécifiquement les tentatives de connexion
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // limite à 5 tentatives
  message: 'Trop de tentatives de connexion. Veuillez réessayer dans une heure.'
});

// Configuration Helmet (sécurité des headers HTTP)
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.BACKEND_URL],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
};

// Validation des entrées
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        details: error.details.map(detail => detail.message)
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
    app.use('/auth/login', authLimiter);
    app.use('/auth/register', authLimiter);
    
    // Logs de sécurité
    app.use((req, res, next) => {
      if (req.method === 'POST' || req.method === 'PUT') {
        console.log(`🔒 ${req.method} ${req.path} - IP: ${req.ip}`);
      }
      next();
    });
  },
  validateInput
};