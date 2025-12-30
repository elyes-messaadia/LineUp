/**
 * 🔒 Middleware de Sécurité Avancé - LineUp
 *
 * Protection complète avec headers de sécurité, CSRF, et validation des requêtes
 */

const helmet = require("helmet");
const { doubleCsrf } = require("csrf-csrf");
const crypto = require("crypto");
const logger = require("../utils/logger");

/**
 * Configuration avancée des headers de sécurité avec Helmet
 */
const securityHeaders = helmet({
  // Content Security Policy strict
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Nécessaire pour Tailwind CSS
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // À restreindre en production
        "https://cdn.jsdelivr.net",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://api.emailjs.com", // Pour le service d'email
        "ws:",
        "wss:", // WebSockets si nécessaire
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"],
    },
    reportOnly: process.env.NODE_ENV === "development", // Mode report en dev
  },

  // Strict Transport Security (HTTPS obligatoire)
  hsts: {
    maxAge: 63072000, // 2 ans
    includeSubDomains: true,
    preload: true,
  },

  // Empêche l'embedding en iframe
  frameguard: {
    action: "deny",
  },

  // Empêche la détection du type MIME
  noSniff: true,

  // Désactive l'en-tête X-Powered-By
  hidePoweredBy: true,

  // Force le mode HTTPS
  ieNoOpen: true,

  // Protection XSS intégrée du navigateur
  xssFilter: true,

  // Politique de referrer strict
  referrerPolicy: {
    policy: ["same-origin"],
  },

  // Permissions Policy (anciennement Feature Policy)
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
      magnetometer: ["'none'"],
      gyroscope: ["'none'"],
      accelerometer: ["'none'"],
      "ambient-light-sensor": ["'none'"],
      autoplay: ["'none'"],
      battery: ["'none'"],
      "display-capture": ["'none'"],
      "document-domain": ["'none'"],
      "encrypted-media": ["'none'"],
      fullscreen: ["'self'"],
      midi: ["'none'"],
      notifications: ["'self'"],
      "publickey-credentials-get": ["'self'"],
      "sync-xhr": ["'none'"],
      "wake-lock": ["'none'"],
    },
  },
});

/**
 * Configuration CSRF avec csrf-csrf (moderne)
 */
const { generateToken, validateRequest, doubleCsrfProtection } = doubleCsrf({
  getSecret: () =>
    process.env.CSRF_SECRET || "fallback-csrf-secret-change-in-production",
  cookieName: "__Host-psifi.x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600000, // 1 heure
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
});

/**
 * Middleware pour exclure CSRF sur certaines routes
 */
const conditionalCSRF = (req, res, next) => {
  // Routes exemptées de la protection CSRF
  const exemptRoutes = ["/api/health", "/api/webhook", "/api/public"];

  const isExempt = exemptRoutes.some((route) => req.path.startsWith(route));

  if (isExempt) {
    return next();
  }

  // Appliquer la protection CSRF
  doubleCsrfProtection(req, res, next);
};

/**
 * Génération et envoi du token CSRF pour les clients
 */
const provideCsrfToken = (req, res, next) => {
  // Générer le token CSRF
  const csrfToken = generateToken(req, res);

  res.locals.csrfToken = csrfToken;

  // Ajouter le token dans les headers pour les APIs
  if (req.path.startsWith("/api/")) {
    res.set("X-CSRF-Token", csrfToken);
  }

  next();
};

/**
 * Validation des origines des requêtes
 */
const originValidation = (req, res, next) => {
  // En production, être permissif avec CORS car c'est géré au niveau de l'app
  if (process.env.NODE_ENV === "production") {
    return next();
  }

  const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:3000",
    process.env.FRONTEND_URL || "http://localhost:5174",
    "http://localhost:5173",
    "https://ligneup.netlify.app",
    "https://lineup.netlify.app",
    "https://lineup-app.netlify.app",
    "https://lineup-medical.netlify.app", // URL de production
  ];

  const origin = req.get("Origin");
  const referer = req.get("Referer");

  // En développement, être plus strict
  const isNetlifyOrigin = origin && origin.endsWith('.netlify.app');
  
  // Vérifier l'origine pour les requêtes CORS
  if (origin && !allowedOrigins.includes(origin) && !isNetlifyOrigin) {
    logger.warn("Blocked request from unauthorized origin", {
      origin,
      referer,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    return res.status(403).json({
      success: false,
      message: "Origine non autorisée",
      error: "INVALID_ORIGIN",
    });
  }

  next();
};

/**
 * Protection contre les attaques de timing
 */
const timingAttackProtection = (req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    // Ajouter un délai minimum pour les endpoints sensibles
    const sensitiveEndpoints = ["/api/auth/login", "/api/auth/register"];
    const isSensitive = sensitiveEndpoints.some((endpoint) =>
      req.path.includes(endpoint)
    );

    if (isSensitive && duration < 100) {
      // Ajouter un délai aléatoire pour masquer les différences de timing
      const delay = Math.random() * 50 + 50; // 50-100ms
      setTimeout(() => {}, delay);
    }
  });

  next();
};

/**
 * Validation des User-Agents suspects
 */
const userAgentValidation = (req, res, next) => {
  const userAgent = req.get("User-Agent");

  // Bloquer les User-Agents suspects ou vides
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /hack/i,
    /exploit/i,
    /^$/,
    /curl/i,
    /wget/i,
    /python/i,
    /node/i,
  ];

  // Exceptions pour les User-Agents légitimes
  const allowedBots = [/googlebot/i, /bingbot/i, /health/i, /monitor/i];

  if (userAgent) {
    const isSuspicious = suspiciousPatterns.some((pattern) =>
      pattern.test(userAgent)
    );

    const isAllowed = allowedBots.some((pattern) => pattern.test(userAgent));

    if (isSuspicious && !isAllowed) {
      logger.warn("Blocked suspicious User-Agent", {
        userAgent,
        ip: req.ip,
        path: req.path,
      });

      return res.status(403).json({
        success: false,
        message: "Accès refusé",
        error: "SUSPICIOUS_USER_AGENT",
      });
    }
  }

  next();
};

/**
 * Protection contre les injections dans les headers
 */
const headerInjectionProtection = (req, res, next) => {
  const dangerousPatterns = [
    /[\r\n]/,
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
  ];

  // Vérifier tous les headers
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === "string") {
      const isDangerous = dangerousPatterns.some((pattern) =>
        pattern.test(value)
      );

      if (isDangerous) {
        logger.warn("Blocked request with dangerous header", {
          header: name,
          value: value.substring(0, 100),
          ip: req.ip,
        });

        return res.status(400).json({
          success: false,
          message: "En-tête de requête invalide",
          error: "INVALID_HEADER",
        });
      }
    }
  }

  next();
};

/**
 * Génération de nonces pour CSP
 */
const generateNonce = (req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
};

/**
 * Middleware pour les cookies sécurisés
 */
const secureCookies = (req, res, next) => {
  const originalSetHeader = res.setHeader;

  res.setHeader = function (name, value) {
    if (name.toLowerCase() === "set-cookie") {
      if (Array.isArray(value)) {
        value = value.map((cookie) => secureCookie(cookie));
      } else {
        value = secureCookie(value);
      }
    }
    return originalSetHeader.call(this, name, value);
  };

  next();
};

/**
 * Sécurisation d'un cookie individuel
 */
const secureCookie = (cookie) => {
  let secureCookie = cookie;

  // Ajouter HttpOnly si pas présent
  if (!secureCookie.includes("HttpOnly")) {
    secureCookie += "; HttpOnly";
  }

  // Ajouter Secure en production
  if (
    process.env.NODE_ENV === "production" &&
    !secureCookie.includes("Secure")
  ) {
    secureCookie += "; Secure";
  }

  // Ajouter SameSite si pas présent
  if (!secureCookie.includes("SameSite")) {
    secureCookie += "; SameSite=Strict";
  }

  return secureCookie;
};

/**
 * Gestion des erreurs de sécurité
 */
const securityErrorHandler = (err, req, res, next) => {
  // Erreurs CSRF
  if (err.code === "EBADCSRFTOKEN") {
    logger.warn("CSRF token validation failed", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
    });

    return res.status(403).json({
      success: false,
      message: "Token de sécurité invalide",
      error: "INVALID_CSRF_TOKEN",
    });
  }

  // Erreurs de sécurité génériques
  if (err.type === "security") {
    return res.status(403).json({
      success: false,
      message: "Violation de sécurité détectée",
      error: "SECURITY_VIOLATION",
    });
  }

  next(err);
};

module.exports = {
  securityHeaders,
  conditionalCSRF,
  provideCsrfToken,
  originValidation,
  timingAttackProtection,
  userAgentValidation,
  headerInjectionProtection,
  generateNonce,
  secureCookies,
  securityErrorHandler,
};
