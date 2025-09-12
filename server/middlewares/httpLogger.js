// Middleware de logging HTTP basé sur pino
const pinoHttp = require('pino-http');
const logger = require('./logger');
const { hmacFingerprint } = require('../utils/fingerprint');

// Configuration du middleware pino-http avec des options personnalisées
const httpLogger = (options = {}) => {
  const defaultOptions = {
    logger: logger,
    
    // Masquer les informations sensibles des headers
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["set-cookie"]',
        'req.body.password',
        'req.body.token',
        'res.headers["set-cookie"]'
      ],
      censor: '[REDACTED]'
    },
    
    // Personnaliser les données loguées pour chaque requête
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
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
      if (process.env.NODE_ENV === 'production') {
        // Utiliser une empreinte HMAC de l'IP au lieu de l'IP brute
        props.ipFingerprint = hmacFingerprint(req.ip);
      } else {
        // En développement, on peut inclure plus d'informations pour le debugging
        props.ip = req.ip;
        props.userAgent = req.headers['user-agent'];
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
    wrapSerializers: true
  };
  
  // Fusionner les options par défaut avec celles passées en paramètre
  const finalOptions = { ...defaultOptions, ...options };
  
  return pinoHttp(finalOptions);
};

module.exports = httpLogger;