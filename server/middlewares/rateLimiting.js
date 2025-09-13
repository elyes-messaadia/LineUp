/**
 * 🛡️ Rate Limiting Avancé - LineUp
 *
 * Middleware de limitation de débit avec règles spécifiques par endpoint
 */

const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const redis = require("redis");
const { logger } = require("../utils/logger");

// Configuration Redis (optionnelle, utilise la mémoire par défaut)
let redisClient;
try {
  if (process.env.REDIS_URL) {
    redisClient = redis.createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", (err) => {
      logger.warn("Redis client error:", err);
      redisClient = null;
    });
  }
} catch (error) {
  logger.warn("Redis connection failed, using memory store:", error.message);
}

/**
 * Handler personnalisé pour les dépassements de limite
 */
const rateLimitHandler = (req, res) => {
  logger.warn("Rate limit exceeded", {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    endpoint: req.originalUrl,
    timestamp: new Date().toISOString(),
  });

  res.status(429).json({
    success: false,
    message: "Trop de requêtes. Veuillez patienter avant de réessayer.",
    error: "RATE_LIMIT_EXCEEDED",
    retryAfter: Math.round(req.rateLimit?.resetTime / 1000) || 60,
  });
};

/**
 * Configuration générale du rate limiting
 */
const createRateLimit = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite par défaut
    message: "Trop de requêtes depuis cette adresse IP",
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: (req) => {
      // Skip pour les requêtes internes ou les webhooks
      const skipIPs = ["127.0.0.1", "::1"];
      const skipUserAgents = ["health-check", "monitoring"];

      return (
        skipIPs.includes(req.ip) ||
        skipUserAgents.some((agent) => req.get("User-Agent")?.includes(agent))
      );
    },
  };

  // Utiliser Redis si disponible
  if (redisClient) {
    defaultOptions.store = new RedisStore({
      client: redisClient,
      prefix: "ratelimit:",
    });
  }

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * Rate limiting strict pour les endpoints sensibles (auth, etc.)
 */
const strictRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  message: {
    success: false,
    message: "Trop de tentatives. Veuillez patienter 15 minutes.",
    error: "AUTH_RATE_LIMIT_EXCEEDED",
  },
});

/**
 * Rate limiting pour les tentatives de connexion
 */
const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 tentatives de connexion
  skipSuccessfulRequests: true, // Ne pas compter les connexions réussies
  message: {
    success: false,
    message: "Trop de tentatives de connexion. Veuillez patienter.",
    error: "LOGIN_RATE_LIMIT_EXCEEDED",
  },
});

/**
 * Rate limiting pour l'inscription
 */
const registerRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 inscriptions par heure
  message: {
    success: false,
    message:
      "Trop d'inscriptions depuis cette adresse IP. Veuillez patienter 1 heure.",
    error: "REGISTER_RATE_LIMIT_EXCEEDED",
  },
});

/**
 * Rate limiting pour les emails (éviter le spam)
 */
const emailRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // 5 emails par heure
  message: {
    success: false,
    message: "Trop d'emails envoyés. Veuillez patienter avant de renvoyer.",
    error: "EMAIL_RATE_LIMIT_EXCEEDED",
  },
});

/**
 * Rate limiting pour les API (général)
 */
const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requêtes API par IP
  message: {
    success: false,
    message: "Quota d'API dépassé. Veuillez patienter.",
    error: "API_RATE_LIMIT_EXCEEDED",
  },
});

/**
 * Rate limiting pour les requêtes de recherche
 */
const searchRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 recherches par minute
  message: {
    success: false,
    message: "Trop de recherches. Veuillez patienter.",
    error: "SEARCH_RATE_LIMIT_EXCEEDED",
  },
});

/**
 * Rate limiting dynamique basé sur l'utilisateur
 */
const createUserBasedRateLimit = (getUserId, limits = {}) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: limits.default || 100,
    keyGenerator: (req) => {
      const userId = getUserId(req);
      return userId ? `user:${userId}` : req.ip;
    },
    skip: (req) => {
      const userId = getUserId(req);
      const userRole = req.user?.role;

      // Limites différentes selon le rôle
      if (userRole === "admin") return true; // Pas de limite pour les admins
      if (userRole === "docteur") req.rateLimit.max = limits.doctor || 300;
      if (userRole === "secretaire")
        req.rateLimit.max = limits.secretary || 200;
      if (userRole === "patient") req.rateLimit.max = limits.patient || 100;

      return false;
    },
    handler: rateLimitHandler,
    store: redisClient
      ? new RedisStore({
          client: redisClient,
          prefix: "user-ratelimit:",
        })
      : undefined,
  });
};

/**
 * Middleware de protection contre les attaques par force brute
 */
const bruteForceProtection = (options = {}) => {
  const attempts = new Map(); // En production, utiliser Redis

  return (req, res, next) => {
    const key = `${req.ip}:${req.originalUrl}`;
    const now = Date.now();
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    const maxAttempts = options.maxAttempts || 5;
    const blockDuration = options.blockDuration || 30 * 60 * 1000; // 30 minutes

    let attemptData = attempts.get(key);

    if (!attemptData) {
      attemptData = { count: 0, firstAttempt: now, blockedUntil: null };
      attempts.set(key, attemptData);
    }

    // Vérifier si l'IP est bloquée
    if (attemptData.blockedUntil && now < attemptData.blockedUntil) {
      const remainingTime = Math.ceil(
        (attemptData.blockedUntil - now) / 1000 / 60
      );
      return res.status(429).json({
        success: false,
        message: `Adresse IP bloquée. Réessayez dans ${remainingTime} minutes.`,
        error: "IP_BLOCKED",
        blockedUntil: new Date(attemptData.blockedUntil).toISOString(),
      });
    }

    // Reset si la fenêtre est expirée
    if (now - attemptData.firstAttempt > windowMs) {
      attemptData.count = 0;
      attemptData.firstAttempt = now;
      attemptData.blockedUntil = null;
    }

    // Incrémenter le compteur pour les réponses d'erreur
    res.on("finish", () => {
      if (res.statusCode >= 400) {
        attemptData.count++;

        if (attemptData.count >= maxAttempts) {
          attemptData.blockedUntil = now + blockDuration;
          logger.warn("IP blocked due to brute force attempts", {
            ip: req.ip,
            endpoint: req.originalUrl,
            attempts: attemptData.count,
            blockedUntil: new Date(attemptData.blockedUntil).toISOString(),
          });
        }
      } else if (res.statusCode < 300) {
        // Reset sur succès
        attemptData.count = Math.max(0, attemptData.count - 1);
      }
    });

    next();
  };
};

/**
 * Nettoyage périodique des données de rate limiting en mémoire
 */
const cleanupInterval = setInterval(() => {
  // En production, ce nettoyage serait géré par Redis TTL
  if (!redisClient) {
    logger.debug("Cleaning up rate limit data in memory");
    // Logique de nettoyage pour les stores en mémoire
  }
}, 60 * 60 * 1000); // Nettoyage toutes les heures

// Arrêter le nettoyage à l'arrêt du serveur
process.on("SIGTERM", () => {
  clearInterval(cleanupInterval);
  if (redisClient) {
    redisClient.quit();
  }
});

module.exports = {
  strictRateLimit,
  loginRateLimit,
  registerRateLimit,
  emailRateLimit,
  apiRateLimit,
  searchRateLimit,
  createRateLimit,
  createUserBasedRateLimit,
  bruteForceProtection,
  rateLimitHandler,
};
