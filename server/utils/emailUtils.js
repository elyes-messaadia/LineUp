/**
 * 📧 Utilitaires de validation et formatage d'emails
 * Fonctions d'aide pour la gestion des emails
 */

const crypto = require("crypto");

class EmailUtils {
  /**
   * ✅ Validation d'adresse email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 🧹 Normalise une adresse email
   */
  static normalizeEmail(email) {
    if (!email || typeof email !== "string") return "";

    return email.toLowerCase().trim();
  }

  /**
   * 🔍 Extrait le domaine d'une adresse email
   */
  static getDomain(email) {
    if (!this.isValidEmail(email)) return "";

    return email.split("@")[1];
  }

  /**
   * 📊 Génère un ID de tracking unique
   */
  static generateTrackingId() {
    return crypto.randomBytes(16).toString("hex");
  }

  /**
   * 🔐 Hash d'email pour le stockage sécurisé
   */
  static hashEmail(email) {
    return crypto
      .createHash("sha256")
      .update(this.normalizeEmail(email))
      .digest("hex");
  }

  /**
   * 🎭 Masque une adresse email pour l'affichage
   * Exemple: john.doe@example.com -> j***@e***e.com
   */
  static maskEmail(email) {
    if (!this.isValidEmail(email)) return email;

    const [localPart, domain] = email.split("@");
    const [domainName, extension] = domain.split(".");

    const maskedLocal =
      localPart.charAt(0) +
      "*".repeat(Math.max(0, localPart.length - 2)) +
      (localPart.length > 1 ? localPart.slice(-1) : "");
    const maskedDomain =
      domainName.charAt(0) +
      "*".repeat(Math.max(0, domainName.length - 2)) +
      (domainName.length > 1 ? domainName.slice(-1) : "");

    return `${maskedLocal}@${maskedDomain}.${extension}`;
  }

  /**
   * 🚫 Vérifie si l'email est dans une liste noire
   */
  static isBlacklisted(email, blacklist = []) {
    const domain = this.getDomain(email);
    const normalizedEmail = this.normalizeEmail(email);

    return blacklist.some(
      (blocked) => normalizedEmail.includes(blocked) || domain === blocked
    );
  }

  /**
   * 🏢 Détecte si c'est un email professionnel
   */
  static isProfessionalEmail(email) {
    const personalDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "free.fr",
      "orange.fr",
      "wanadoo.fr",
      "sfr.fr",
      "laposte.net",
    ];

    const domain = this.getDomain(email);
    return !personalDomains.includes(domain);
  }

  /**
   * 📏 Valide la longueur d'un email
   */
  static isValidLength(email, maxLength = 254) {
    return email && email.length <= maxLength;
  }

  /**
   * 🧪 Validation complète d'un email
   */
  static validateEmail(email, options = {}) {
    const { allowPersonal = true, blacklist = [], maxLength = 254 } = options;

    const errors = [];

    if (!email) {
      errors.push("Email requis");
      return { isValid: false, errors };
    }

    if (!this.isValidEmail(email)) {
      errors.push("Format d'email invalide");
    }

    if (!this.isValidLength(email, maxLength)) {
      errors.push(`Email trop long (max ${maxLength} caractères)`);
    }

    if (this.isBlacklisted(email, blacklist)) {
      errors.push("Email non autorisé");
    }

    if (!allowPersonal && !this.isProfessionalEmail(email)) {
      errors.push("Seuls les emails professionnels sont acceptés");
    }

    return {
      isValid: errors.length === 0,
      errors,
      email: this.normalizeEmail(email),
      domain: this.getDomain(email),
      isProfessional: this.isProfessionalEmail(email),
      masked: this.maskEmail(email),
    };
  }

  /**
   * 📝 Génère un nom d'affichage depuis un email
   */
  static generateDisplayName(email) {
    if (!this.isValidEmail(email)) return "Utilisateur";

    const localPart = email.split("@")[0];

    // Sépare par points ou tirets et capitalise
    return localPart
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * 🎨 Génère une couleur basée sur l'email (pour les avatars)
   */
  static generateEmailColor(email) {
    const hash = this.hashEmail(email);
    const hue = parseInt(hash.substring(0, 8), 16) % 360;

    return {
      hue,
      hsl: `hsl(${hue}, 70%, 50%)`,
      hex: this.hslToHex(hue, 70, 50),
    };
  }

  /**
   * 🌈 Convertit HSL en HEX
   */
  static hslToHex(h, s, l) {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  /**
   * 📈 Statistiques d'un lot d'emails
   */
  static analyzeEmails(emails = []) {
    const validEmails = emails.filter((email) => this.isValidEmail(email));
    const domains = validEmails.map((email) => this.getDomain(email));
    const domainStats = {};

    domains.forEach((domain) => {
      domainStats[domain] = (domainStats[domain] || 0) + 1;
    });

    return {
      total: emails.length,
      valid: validEmails.length,
      invalid: emails.length - validEmails.length,
      uniqueDomains: Object.keys(domainStats).length,
      topDomains: Object.entries(domainStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      professionalCount: validEmails.filter((email) =>
        this.isProfessionalEmail(email)
      ).length,
    };
  }
}

module.exports = EmailUtils;
