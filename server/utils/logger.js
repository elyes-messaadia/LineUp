const pino = require("pino");

// Configuration des options de base du logger
const baseOptions = {
  // Niveau de log configuré via variable d'environnement ou par défaut
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),

  // Masquer automatiquement certaines informations sensibles si elles sont accidentellement loguées
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.headers["set-cookie"]',
      "*.password",
      "*.token",
      "*.jwt",
      "*.refreshToken",
      "req.body.password",
      "req.body.token",
    ],
    censor: "[DONNÉES SENSIBLES]",
  },

  // Formatage amélioré des logs
  formatters: {
    level: (label) => {
      return { level: label };
    },
    // Ajouter un horodatage ISO et le contexte d'exécution
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        hostname: bindings.hostname,
        env: process.env.NODE_ENV || "development",
        app: "lineup-server",
      };
    },
  },

  // En mode production, structure les logs pour faciliter l'analyse
  // En développement, formate les logs pour une meilleure lisibilité
  // En mode test, désactive pino-pretty pour éviter les erreurs
  ...(process.env.NODE_ENV === "production"
    ? { timestamp: pino.stdTimeFunctions.isoTime }
    : process.env.NODE_ENV === "test"
    ? {
        level: "silent", // Désactive les logs pendant les tests
      }
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
          },
        },
      }),
};

// Créer l'instance du logger avec les options définies
const logger = pino(baseOptions);

// Ajouter une fonction pour créer des loggers enfants avec un contexte spécifique
logger.getSubLogger = (context) => {
  return logger.child({ context });
};

// Log d'initialisation
if (process.env.NODE_ENV !== "test") {
  logger.info("Logger initialized");
}

module.exports = logger;
