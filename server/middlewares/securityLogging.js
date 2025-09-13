/**
 * 📊 Système de Logging Avancé - LineUp
 *
 * Logging de sécurité et monitoring des activités suspectes
 */

const { logger } = require("../utils/logger");
const crypto = require("crypto");

/**
 * Middleware de logging des requêtes avec détection d'anomalies
 */
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = crypto.randomBytes(8).toString("hex");

  // Ajouter l'ID de requête aux headers
  req.requestId = requestId;
  res.set("X-Request-ID", requestId);

  // Informations de base de la requête
  const requestInfo = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    referer: req.get("Referer"),
    timestamp: new Date().toISOString(),
    userId: req.user?.id || null,
    userRole: req.user?.role || null,
  };

  // Détecter les patterns suspects
  const suspiciousPatterns = detectSuspiciousActivity(req);
  if (suspiciousPatterns.length > 0) {
    logger.warn("Suspicious activity detected", {
      ...requestInfo,
      suspiciousPatterns,
      severity: "HIGH",
    });
  }

  // Logger la requête entrante
  logger.info("Incoming request", requestInfo);

  // Intercepter la réponse
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const responseSize = Buffer.byteLength(data || "");

    // Informations de réponse
    const responseInfo = {
      requestId,
      statusCode: res.statusCode,
      duration,
      responseSize,
      contentType: res.get("Content-Type"),
    };

    // Logger selon le statut
    if (res.statusCode >= 500) {
      logger.error("Server error response", {
        ...requestInfo,
        ...responseInfo,
        severity: "CRITICAL",
      });
    } else if (res.statusCode >= 400) {
      logger.warn("Client error response", {
        ...requestInfo,
        ...responseInfo,
        severity: "MEDIUM",
      });
    } else {
      logger.info("Successful response", {
        ...requestInfo,
        ...responseInfo,
      });
    }

    // Analyser les réponses lentes
    if (duration > 5000) {
      // Plus de 5 secondes
      logger.warn("Slow response detected", {
        ...requestInfo,
        ...responseInfo,
        severity: "MEDIUM",
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Détection d'activités suspectes
 */
const detectSuspiciousActivity = (req) => {
  const patterns = [];
  const url = req.originalUrl.toLowerCase();
  const userAgent = req.get("User-Agent") || "";
  const method = req.method;

  // Tentatives d'accès à des fichiers système
  const systemFilePaths = [
    "/etc/passwd",
    "/etc/shadow",
    "/proc/",
    "/sys/",
    "/.env",
    "/config/",
    "/admin/",
    "/.git/",
    "/.ssh/",
    "/backup/",
    "/db/",
    "/database/",
  ];

  if (systemFilePaths.some((path) => url.includes(path))) {
    patterns.push("SYSTEM_FILE_ACCESS");
  }

  // Tentatives d'injection SQL
  const sqlInjectionPatterns = [
    /union.*select/i,
    /select.*from/i,
    /insert.*into/i,
    /delete.*from/i,
    /drop.*table/i,
    /exec.*sp_/i,
    /--/,
    /;.*--/,
    /'.*or.*'.*=/i,
  ];

  const queryString = JSON.stringify(req.query) + JSON.stringify(req.body);
  if (sqlInjectionPatterns.some((pattern) => pattern.test(queryString))) {
    patterns.push("SQL_INJECTION_ATTEMPT");
  }

  // Tentatives XSS
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    /onmouseover=/i,
    /eval\(/i,
    /alert\(/i,
    /document\.cookie/i,
    /window\.location/i,
  ];

  if (xssPatterns.some((pattern) => pattern.test(queryString + url))) {
    patterns.push("XSS_ATTEMPT");
  }

  // Directory traversal
  const traversalPatterns = [
    /\.\.\//,
    /\.\.%2f/i,
    /\.\.%5c/i,
    /%2e%2e%2f/i,
    /%2e%2e%5c/i,
  ];

  if (traversalPatterns.some((pattern) => pattern.test(url))) {
    patterns.push("DIRECTORY_TRAVERSAL");
  }

  // Scans de ports/vulnérabilités
  const scanPatterns = [
    /nmap/i,
    /nikto/i,
    /sqlmap/i,
    /burp/i,
    /dirb/i,
    /gobuster/i,
    /wfuzz/i,
    /masscan/i,
  ];

  if (scanPatterns.some((pattern) => pattern.test(userAgent))) {
    patterns.push("VULNERABILITY_SCAN");
  }

  // Tentatives de force brute
  if (url.includes("/login") || url.includes("/auth")) {
    // Cette logique sera améliorée avec un système de compteurs
    patterns.push("POTENTIAL_BRUTE_FORCE");
  }

  // Méthodes HTTP non autorisées
  const allowedMethods = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "OPTIONS",
    "HEAD",
  ];
  if (!allowedMethods.includes(method)) {
    patterns.push("UNAUTHORIZED_HTTP_METHOD");
  }

  // User-Agents suspects
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /go-http-client/i,
  ];

  if (
    botPatterns.some((pattern) => pattern.test(userAgent)) &&
    !userAgent.match(/(google|bing|yahoo|duckduck)bot/i)
  ) {
    patterns.push("SUSPICIOUS_USER_AGENT");
  }

  // Referer suspect
  const referer = req.get("Referer");
  if (referer && !referer.includes(req.get("Host"))) {
    const suspiciousDomains = [
      "malware",
      "phishing",
      "spam",
      "hack",
      "exploit",
    ];

    if (suspiciousDomains.some((domain) => referer.includes(domain))) {
      patterns.push("SUSPICIOUS_REFERER");
    }
  }

  return patterns;
};

/**
 * Logger spécialisé pour les événements d'authentification
 */
const authLogger = (event, req, data = {}) => {
  const logData = {
    event,
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
    ...data,
  };

  switch (event) {
    case "LOGIN_SUCCESS":
      logger.info("User login successful", logData);
      break;
    case "LOGIN_FAILURE":
      logger.warn("User login failed", { ...logData, severity: "MEDIUM" });
      break;
    case "REGISTER_SUCCESS":
      logger.info("User registration successful", logData);
      break;
    case "REGISTER_FAILURE":
      logger.warn("User registration failed", {
        ...logData,
        severity: "MEDIUM",
      });
      break;
    case "LOGOUT":
      logger.info("User logout", logData);
      break;
    case "PASSWORD_RESET_REQUEST":
      logger.info("Password reset requested", logData);
      break;
    case "PASSWORD_RESET_SUCCESS":
      logger.info("Password reset successful", logData);
      break;
    case "ACCOUNT_LOCKED":
      logger.warn("Account locked due to failed attempts", {
        ...logData,
        severity: "HIGH",
      });
      break;
    case "SUSPICIOUS_LOGIN":
      logger.warn("Suspicious login attempt detected", {
        ...logData,
        severity: "HIGH",
      });
      break;
    default:
      logger.info("Authentication event", logData);
  }
};

/**
 * Logger pour les actions administratives
 */
const adminLogger = (action, req, data = {}) => {
  const logData = {
    action,
    requestId: req.requestId,
    adminId: req.user?.id,
    adminEmail: req.user?.email,
    ip: req.ip,
    timestamp: new Date().toISOString(),
    ...data,
  };

  logger.warn("Administrative action performed", {
    ...logData,
    severity: "HIGH",
    category: "ADMIN_ACTION",
  });
};

/**
 * Logger pour les erreurs de sécurité
 */
const securityErrorLogger = (error, req, severity = "MEDIUM") => {
  logger.error("Security error occurred", {
    error: error.message,
    stack: error.stack,
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
    severity,
    category: "SECURITY_ERROR",
  });
};

/**
 * Middleware pour logger les changements de données sensibles
 */
const dataChangeLogger = (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const originalSend = res.send;

    res.send = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logger.info("Data modification successful", {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl,
          userId: req.user?.id,
          userRole: req.user?.role,
          timestamp: new Date().toISOString(),
          category: "DATA_CHANGE",
        });
      }

      return originalSend.call(this, data);
    };
  }

  next();
};

/**
 * Système d'alertes en temps réel
 */
const alertSystem = {
  // Seuils d'alerte
  thresholds: {
    FAILED_LOGINS_PER_IP: 10,
    REQUESTS_PER_MINUTE: 300,
    ERROR_RATE_THRESHOLD: 0.1, // 10%
  },

  // Compteurs en mémoire (à remplacer par Redis en production)
  counters: new Map(),

  // Vérifier les seuils et déclencher des alertes
  checkThresholds(req, event) {
    const ip = req.ip;
    const minute = Math.floor(Date.now() / 60000);
    const key = `${ip}:${minute}`;

    if (!this.counters.has(key)) {
      this.counters.set(key, { requests: 0, errors: 0, failedLogins: 0 });
    }

    const counter = this.counters.get(key);
    counter.requests++;

    if (event === "ERROR") counter.errors++;
    if (event === "FAILED_LOGIN") counter.failedLogins++;

    // Vérifier les seuils
    if (counter.requests > this.thresholds.REQUESTS_PER_MINUTE) {
      this.triggerAlert("HIGH_REQUEST_RATE", {
        ip,
        requests: counter.requests,
      });
    }

    if (counter.failedLogins > this.thresholds.FAILED_LOGINS_PER_IP) {
      this.triggerAlert("BRUTE_FORCE_DETECTED", {
        ip,
        failedLogins: counter.failedLogins,
      });
    }

    const errorRate = counter.errors / counter.requests;
    if (
      errorRate > this.thresholds.ERROR_RATE_THRESHOLD &&
      counter.requests > 10
    ) {
      this.triggerAlert("HIGH_ERROR_RATE", { ip, errorRate });
    }
  },

  // Déclencher une alerte
  triggerAlert(type, data) {
    logger.error("Security alert triggered", {
      alertType: type,
      ...data,
      timestamp: new Date().toISOString(),
      severity: "CRITICAL",
      category: "SECURITY_ALERT",
    });

    // Ici, on pourrait envoyer des notifications par email, Slack, etc.
  },

  // Nettoyage périodique des compteurs
  cleanup() {
    const now = Math.floor(Date.now() / 60000);
    for (const [key] of this.counters) {
      const [, minute] = key.split(":");
      if (now - parseInt(minute) > 10) {
        // Garder 10 minutes
        this.counters.delete(key);
      }
    }
  },
};

// Nettoyage toutes les minutes
setInterval(() => alertSystem.cleanup(), 60000);

module.exports = {
  securityLogger,
  authLogger,
  adminLogger,
  securityErrorLogger,
  dataChangeLogger,
  detectSuspiciousActivity,
  alertSystem,
};
