// Express middleware pour détecter et bloquer les attaques potentielles
const logger = require('../utils/logger');

/**
 * Middleware qui détecte des patterns d'attaque dans les requêtes 
 * et peut bloquer ou journaliser les tentatives suspectes
 */
const securityGuard = (options = {}) => {
  const defaultOptions = {
    // Si vrai, bloque les requêtes suspectes, sinon juste les journalise
    blockSuspiciousRequests: process.env.NODE_ENV === 'production',
    // Types de requêtes à analyser
    inspectMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    // Journaliser les détections même si on ne bloque pas
    logOnly: process.env.NODE_ENV !== 'production',
  };

  const config = { ...defaultOptions, ...options };
  const securityLogger = logger.getSubLogger('security-guard');

  return (req, res, next) => {
    try {
      if (!config.inspectMethods.includes(req.method)) {
        return next();
      }
      
      let suspicious = false;
      let attackType = null;
      
      // Détecter les tentatives d'injection SQL/NoSQL dans les paramètres URL
      const urlParams = req.url.split('?')[1] || '';
      if (
        /(\s|%20)(or|and|select|from|where|union|insert|delete|update)(\s|%20)/i.test(urlParams) || 
        /(\$ne|\$gt|\$lt|\$in|\$regex|%24ne|%24gt|%24lt|%24in|%24regex)/i.test(urlParams)
      ) {
        suspicious = true;
        attackType = 'INJECTION_URL';
      }
      
      // Détecter des attaques potentielles XSS dans les paramètres URL
      if (
        /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/i.test(urlParams) ||
        /((\%3C)|<)((\%69)|i|(\%49))((\%6D)|m|(\%4D))((\%67)|g|(\%47))/i.test(urlParams) ||
        /((\%3C)|<)[^\n]+((\%3E)|>)/i.test(urlParams)
      ) {
        suspicious = true;
        attackType = 'XSS_URL';
      }
      
      // Vérifier les en-têtes pour détecter des scans automatisés ou attaques
      const userAgent = req.headers['user-agent'] || '';
      if (
        /sqlmap|nikto|nessus|nmap|acunetix|burp|ZAP|w3af|hydra|gobuster|dirbuster/i.test(userAgent)
      ) {
        suspicious = true;
        attackType = 'SCAN_TOOL';
      }
      
      // Si une activité suspecte est détectée
      if (suspicious) {
        const logData = {
          method: req.method,
          url: req.url,
          userAgent,
          attackType,
          ip: req.ip,
          headers: req.headers,
          params: req.params,
          query: req.query
        };
        
        // Journaliser l'activité suspecte
        securityLogger.warn(logData, `Détection de sécurité: ${attackType}`);
        
        // Bloquer la requête si configuré pour le faire
        if (config.blockSuspiciousRequests) {
          return res.status(403).json({
            success: false,
            message: "Requête bloquée pour raison de sécurité"
          });
        }
      }
      
      // Si tout est normal ou si on est en mode log uniquement, continuer
      next();
    } catch (error) {
      // En cas d'erreur dans le middleware, journaliser et continuer
      securityLogger.error({ err: error }, "Erreur dans le middleware securityGuard");
      next();
    }
  };
};

module.exports = securityGuard;