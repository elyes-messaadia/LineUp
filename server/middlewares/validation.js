/**
 * 🛡️ Middleware de Validation Sécurisé - Backend LineUp
 *
 * Validation et sanitisation côté serveur avec protection avancée
 */

const validator = require("validator");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss");
const logger = require("../utils/logger");

// 🧹 Sanitisation sécurisée
const sanitize = {
  text: (input) => {
    if (typeof input !== "string") return "";
    return xss(validator.escape(input.trim()));
  },

  email: (input) => {
    if (typeof input !== "string") return "";
    return validator.normalizeEmail(input.toLowerCase()) || "";
  },

  name: (input) => {
    if (typeof input !== "string") return "";
    const cleaned = sanitize.text(input);
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  },

  phone: (input) => {
    if (typeof input !== "string") return "";
    return input.replace(/\D/g, "");
  },
};

// ✅ Règles de validation serveur
const validationRules = {
  email: {
    required: true,
    validator: (value) => validator.isEmail(value),
    sanitizer: sanitize.email,
    message: "Email invalide",
  },

  password: {
    required: true,
    validator: (value) =>
      validator.isStrongPassword(value, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      }),
    message:
      "Mot de passe trop faible (8+ caractères, maj, min, chiffre, symbole)",
  },

  firstName: {
    required: true,
    validator: (value) =>
      validator.isLength(value, { min: 2, max: 50 }) &&
      validator.isAlpha(value, "fr-FR", { ignore: " '-" }),
    sanitizer: sanitize.name,
    message: "Prénom invalide (2-50 caractères, lettres uniquement)",
  },

  lastName: {
    required: true,
    validator: (value) =>
      validator.isLength(value, { min: 2, max: 50 }) &&
      validator.isAlpha(value, "fr-FR", { ignore: " '-" }),
    sanitizer: sanitize.name,
    message: "Nom invalide (2-50 caractères, lettres uniquement)",
  },

  phone: {
    required: false,
    validator: (value) => !value || validator.isMobilePhone(value, "fr-FR"),
    sanitizer: sanitize.phone,
    message: "Numéro de téléphone français invalide",
  },

  role: {
    required: true,
    validator: (value) =>
      ["patient", "docteur", "secretaire", "admin"].includes(value),
    message: "Rôle invalide",
  },
};

// 🔍 Validation d'un champ
const validateField = (field, value, rules = validationRules) => {
  const rule = rules[field];
  if (!rule) return { isValid: true, sanitizedValue: value };

  // Vérification required
  if (rule.required && (!value || value.toString().trim() === "")) {
    return {
      isValid: false,
      error: `${field} est obligatoire`,
      sanitizedValue: "",
    };
  }

  // Si pas requis et vide, OK
  if (!rule.required && (!value || value.toString().trim() === "")) {
    return { isValid: true, sanitizedValue: "" };
  }

  // Sanitisation
  const sanitizedValue = rule.sanitizer
    ? rule.sanitizer(value)
    : sanitize.text(value);

  // Validation
  if (!rule.validator(sanitizedValue)) {
    return {
      isValid: false,
      error: rule.message,
      sanitizedValue,
    };
  }

  return { isValid: true, sanitizedValue };
};

// 🛡️ Middleware de validation générique
const createValidationMiddleware = (fields) => {
  return (req, res, next) => {
    const errors = {};
    const sanitizedData = {};
    let hasErrors = false;

    // Validation de chaque champ
    fields.forEach((field) => {
      const result = validateField(field, req.body[field]);

      if (!result.isValid) {
        errors[field] = result.error;
        hasErrors = true;
      }

      sanitizedData[field] = result.sanitizedValue;
    });

    if (hasErrors) {
      logger.warn("Validation échouée", {
        errors,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors,
      });
    }

    // Remplacer les données par les versions sanitisées
    req.body = { ...req.body, ...sanitizedData };
    req.sanitizedData = sanitizedData;

    next();
  };
};

// 🚨 Rate limiting spécialisé
const createAuthRateLimit = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives max
    message: {
      success: false,
      message: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
      retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Utiliser IP + User-Agent pour plus de précision
      return `${req.ip}_${req.get("User-Agent")}`;
    },
    skip: (req) => {
      // Skip pour les IPs de développement
      const devIPs = ["127.0.0.1", "::1", "192.168.1.1"];
      return process.env.NODE_ENV === "development" && devIPs.includes(req.ip);
    },
    onLimitReached: (req) => {
      logger.warn("Rate limit atteint", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        endpoint: req.path,
      });
    },
  });

const createRegistrationRateLimit = () =>
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3, // 3 inscriptions max par heure
    message: {
      success: false,
      message: "Trop d'inscriptions. Réessayez dans 1 heure.",
      retryAfter: 60 * 60,
    },
  });

// 🔐 Protection CSRF
const csrfProtection = (req, res, next) => {
  // Skip pour GET requests
  if (req.method === "GET") return next();

  const token = req.headers["x-csrf-token"] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    logger.warn("Token CSRF invalide", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      providedToken: token ? "présent" : "absent",
      sessionToken: sessionToken ? "présent" : "absent",
    });

    return res.status(403).json({
      success: false,
      message: "Token CSRF invalide",
    });
  }

  next();
};

// 🛡️ Protection contre l'injection SQL/NoSQL
const mongoSanitize = require("express-mongo-sanitize");

// 🔒 Middleware de sécurité complet
const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
  mongoSanitize({
    replaceWith: "_",
  }),
];

// 📝 Validation spécialisée pour l'inscription
const validateRegistration = createValidationMiddleware([
  "email",
  "password",
  "firstName",
  "lastName",
  "phone",
  "role",
]);

// 🔑 Validation spécialisée pour la connexion
const validateLogin = createValidationMiddleware(["email", "password"]);

// 🎟️ Validation pour création de ticket
const validateTicket = createValidationMiddleware([
  "firstName",
  "lastName",
  "phone",
]);

// 👤 Validation pour mise à jour profil
const validateProfile = createValidationMiddleware([
  "firstName",
  "lastName",
  "phone",
]);

// 🧪 Middleware de test des validations
const testValidation = (req, res) => {
  const testData = {
    email: "test@example.com",
    password: "Test123!@#",
    firstName: "Jean",
    lastName: "Dupont",
    phone: "0123456789",
    role: "patient",
  };

  const results = {};
  Object.keys(testData).forEach((field) => {
    results[field] = validateField(field, testData[field]);
  });

  res.json({
    success: true,
    message: "Tests de validation",
    results,
  });
};

module.exports = {
  sanitize,
  validateField,
  createValidationMiddleware,
  validateRegistration,
  validateLogin,
  validateTicket,
  validateProfile,
  createAuthRateLimit,
  createRegistrationRateLimit,
  csrfProtection,
  securityMiddleware,
  testValidation,
};
