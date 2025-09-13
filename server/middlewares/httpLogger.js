// Middleware de logging HTTP basé sur pino
const pinoHttp = require("pino-http");
const logger = require("../utils/logger");
const { hmacFingerprint } = require("../utils/fingerprint");

// Configuration du middleware pino-http avec des options personnalisées
const httpLogger = (options = {}) => {
  const defaultOptions = {
    // En mode test, désactiver le logger pour éviter les conflits
    ...(process.env.NODE_ENV === "test"
      ? { logger: false }
      : { logger: logger }),

    // Masquer les informations sensibles
    redact: {
      paths: [
        // Headers sensibles
        "req.headers.authorization",
        "req.headers.cookie",
        'req.headers["set-cookie"]',
        // Corps de la requête
        "req.body.password",
        "req.body.token",
        "req.body.accessToken",
        "req.body.refreshToken",
        "req.body.apiKey",
        "req.body.secret",
        // Paramètres de requête
        "req.query.token",
        "req.query.accessToken",
        "req.query.refreshToken",
        // Headers de réponse
        'res.headers["set-cookie"]',
        // Paramètres de session
        "req.session.token",
        "req.session.accessToken",
        // Chemins dynamiques pour les tokens
        "*token*",
        "*Token*",
        "*password*",
        "*Password*",
        "*secret*",
        "*Secret*",
        "*key*",
        "*Key*"
      ],
      // Remplacer par une valeur générique
      censor: "[DONNÉES SENSIBLES MASQUÉES]",
    },

    // Fonction de nettoyage personnalisée pour les données sensibles
    serializers: {
      req: (req) => {
        // Créer une copie pour ne pas modifier l'objet original
        const sanitizedReq = JSON.parse(JSON.stringify(req));
        
        // Nettoyer les headers d'autorisation
        if (sanitizedReq.headers && sanitizedReq.headers.authorization) {
          sanitizedReq.headers.authorization = "[AUTHORIZATION MASQUÉE]";
        }
        
        // Nettoyer les cookies
        if (sanitizedReq.headers && sanitizedReq.headers.cookie) {
          sanitizedReq.headers.cookie = sanitizedReq.headers.cookie.replace(
            /(session|token|auth)=[^;]+/gi,
            "$1=[MASQUÉ]"
          );
        }
        
        return sanitizedReq;
      }
    },

    // Personnaliser les données loguées pour chaque requête
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },

    // Ajouter des informations contextuelles à chaque log
    customProps: (req, res) => {
      const props = {
        method: req.method,
        url: req.url,
        path: req.path,
        statusCode: res.statusCode,
        responseTime: res.responseTime,
      };

      // En production, anonymiser l'adresse IP et ne pas logger certaines données
      if (process.env.NODE_ENV === "production") {
        // Utiliser une empreinte HMAC de l'IP au lieu de l'IP brute
        props.ipFingerprint = hmacFingerprint(req.ip);
      } else {
        // En développement, on peut inclure plus d'informations pour le debugging
        props.ip = req.ip;
        props.userAgent = req.headers["user-agent"];
        props.referer = req.headers.referer;
      }

      return props;
    },

    // Fonction exécutée à chaque log
    customSuccessMessage: (req, res) => {
      if (res.statusCode >= 400) {
        return `Erreur HTTP ${res.statusCode}`;
      }
      return `${req.method} ${req.url}`;
    },

    // Ne pas créer un nouveau logger child pour chaque requête
    wrapSerializers: true,
  };

  // Fusionner les options par défaut avec celles passées en paramètre
  const finalOptions = { ...defaultOptions, ...options };

  // En environnement de test, utiliser un middleware simplifié pour éviter les problèmes
  if (process.env.NODE_ENV === "test") {
    return (req, res, next) => {
      // Ajouter un ID de requête simulé
      req.id = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      next();
    };
  }

  return pinoHttp(finalOptions);
};

module.exports = httpLogger;
