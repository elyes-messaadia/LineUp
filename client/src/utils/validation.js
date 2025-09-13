/**
 * 🛡️ Système de Validation Sécurisé - LineUp
 *
 * Validation unifiée côté client et serveur avec protection avancée
 */

import { useState } from "react";
import DOMPurify from "dompurify";

// 🔒 Regex de validation sécurisés
const VALIDATION_PATTERNS = {
  email:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  name: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
  phone: /^(?:\+33|0)[1-9](?:[0-9]{8})$/,
  postalCode: /^[0-9]{5}$/,
  alphanumeric: /^[a-zA-Z0-9À-ÿ\s'-]{2,100}$/,
};

// 🧹 Sanitisation des données
export const sanitize = {
  text: (input) => {
    if (typeof input !== "string") return "";
    return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [] });
  },

  email: (input) => {
    return sanitize.text(input).toLowerCase();
  },

  name: (input) => {
    const cleaned = sanitize.text(input);
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  },

  phone: (input) => {
    return sanitize.text(input).replace(/\s/g, "");
  },
};

// ✅ Règles de validation
export const validationRules = {
  email: {
    required: true,
    pattern: VALIDATION_PATTERNS.email,
    minLength: 5,
    maxLength: 254,
    messages: {
      required: "L'email est obligatoire",
      pattern: "Format d'email invalide",
      minLength: "Email trop court",
      maxLength: "Email trop long",
    },
  },

  password: {
    required: true,
    pattern: VALIDATION_PATTERNS.password,
    minLength: 8,
    maxLength: 128,
    messages: {
      required: "Le mot de passe est obligatoire",
      pattern:
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial",
      minLength: "Mot de passe trop court (minimum 8 caractères)",
      maxLength: "Mot de passe trop long",
    },
  },

  confirmPassword: {
    required: true,
    match: "password",
    messages: {
      required: "Confirmation obligatoire",
      match: "Les mots de passe ne correspondent pas",
    },
  },

  firstName: {
    required: true,
    pattern: VALIDATION_PATTERNS.name,
    minLength: 2,
    maxLength: 50,
    messages: {
      required: "Le prénom est obligatoire",
      pattern:
        "Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets",
      minLength: "Prénom trop court",
      maxLength: "Prénom trop long",
    },
  },

  lastName: {
    required: true,
    pattern: VALIDATION_PATTERNS.name,
    minLength: 2,
    maxLength: 50,
    messages: {
      required: "Le nom est obligatoire",
      pattern:
        "Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets",
      minLength: "Nom trop court",
      maxLength: "Nom trop long",
    },
  },

  phone: {
    required: false,
    pattern: VALIDATION_PATTERNS.phone,
    messages: {
      pattern: "Numéro de téléphone français invalide",
    },
  },

  address: {
    required: false,
    pattern: VALIDATION_PATTERNS.alphanumeric,
    maxLength: 200,
    messages: {
      pattern: "Adresse invalide",
      maxLength: "Adresse trop longue",
    },
  },

  postalCode: {
    required: false,
    pattern: VALIDATION_PATTERNS.postalCode,
    messages: {
      pattern: "Code postal français invalide (5 chiffres)",
    },
  },

  city: {
    required: false,
    pattern: VALIDATION_PATTERNS.name,
    maxLength: 100,
    messages: {
      pattern: "Nom de ville invalide",
      maxLength: "Nom de ville trop long",
    },
  },
};

// 🔍 Fonction de validation principale
export const validateField = (field, value, allValues = {}) => {
  const rules = validationRules[field];
  if (!rules) return { isValid: true, errors: [] };

  const errors = [];
  const sanitizedValue = sanitize.text(value);

  // Validation required
  if (rules.required && (!sanitizedValue || sanitizedValue.length === 0)) {
    errors.push(rules.messages.required);
    return { isValid: false, errors };
  }

  // Si le champ est vide et non requis, c'est valide
  if (!sanitizedValue && !rules.required) {
    return { isValid: true, errors: [] };
  }

  // Validation pattern
  if (rules.pattern && !rules.pattern.test(sanitizedValue)) {
    errors.push(rules.messages.pattern);
  }

  // Validation minLength
  if (rules.minLength && sanitizedValue.length < rules.minLength) {
    errors.push(rules.messages.minLength);
  }

  // Validation maxLength
  if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
    errors.push(rules.messages.maxLength);
  }

  // Validation match (pour confirmation de mot de passe)
  if (rules.match && sanitizedValue !== sanitize.text(allValues[rules.match])) {
    errors.push(rules.messages.match);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue,
  };
};

// 🔒 Validation de formulaire complet
export const validateForm = (formData, fieldsToValidate) => {
  const results = {};
  let hasErrors = false;

  fieldsToValidate.forEach((field) => {
    const result = validateField(field, formData[field], formData);
    results[field] = result;
    if (!result.isValid) hasErrors = true;
  });

  return {
    isValid: !hasErrors,
    results,
  };
};

// 🛡️ Hook React pour validation en temps réel
export const useFormValidation = (
  initialValues = {},
  fieldsToValidate = []
) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateAndSetField = (field, value) => {
    const result = validateField(field, value, values);

    setValues((prev) => ({
      ...prev,
      [field]: result.sanitizedValue || value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: result.errors,
    }));

    return result.isValid;
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    validateAndSetField(field, value);
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const validateAll = () => {
    const validation = validateForm(values, fieldsToValidate);
    setErrors(validation.results);

    // Marquer tous les champs comme touchés
    const allTouched = {};
    fieldsToValidate.forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    return validation.isValid;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  const getFieldProps = (field) => ({
    value: values[field] || "",
    onChange: handleChange(field),
    onBlur: handleBlur(field),
    error: touched[field] && errors[field] && errors[field].length > 0,
    helperText: touched[field] && errors[field] ? errors[field][0] : "",
  });

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    getFieldProps,
    isValid: fieldsToValidate.every(
      (field) => !errors[field] || errors[field].length === 0
    ),
  };
};

// 🚨 Protection contre les attaques de force brute
export const createRateLimiter = (
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
) => {
  const attempts = new Map();

  return (identifier) => {
    const now = Date.now();
    const userAttempts = attempts.get(identifier) || {
      count: 0,
      resetTime: now + windowMs,
    };

    if (now > userAttempts.resetTime) {
      userAttempts.count = 0;
      userAttempts.resetTime = now + windowMs;
    }

    userAttempts.count++;
    attempts.set(identifier, userAttempts);

    return {
      allowed: userAttempts.count <= maxAttempts,
      remaining: Math.max(0, maxAttempts - userAttempts.count),
      resetTime: userAttempts.resetTime,
    };
  };
};

// 🔐 Génération de tokens CSRF sécurisés
export const generateCSRFToken = () => {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
};

export default {
  sanitize,
  validationRules,
  validateField,
  validateForm,
  useFormValidation,
  createRateLimiter,
  generateCSRFToken,
};
