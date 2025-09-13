/**
 * 📅 Utilitaires de gestion des dates - LineUp
 *
 * Fonctions pour formatter et manipuler les dates dans l'application
 */

/**
 * Formate une date au format français
 * @param {string|Date} date - Date à formatter
 * @param {Object} options - Options de formatage
 * @returns {string} Date formatée
 */
export const formatDate = (date, options = {}) => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

  const defaultOptions = {
    weekday: undefined,
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  return dateObj.toLocaleDateString("fr-FR", defaultOptions);
};

/**
 * Formate une date au format court (dd/mm/yyyy)
 * @param {string|Date} date - Date à formatter
 * @returns {string} Date formatée
 */
export const formatDateShort = (date) => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formate une heure
 * @param {string} time - Heure au format HH:MM
 * @returns {string} Heure formatée
 */
export const formatTime = (time) => {
  if (!time) return "";

  // Si c'est déjà au format HH:MM, on le retourne tel quel
  if (typeof time === "string" && time.match(/^\d{2}:\d{2}$/)) {
    return time;
  }

  // Si c'est un objet Date
  if (time instanceof Date) {
    return time.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return time;
};

/**
 * Formate une date avec l'heure
 * @param {string|Date} date - Date
 * @param {string} time - Heure au format HH:MM
 * @returns {string} Date et heure formatées
 */
export const formatDateTime = (date, time) => {
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  if (!formattedDate) return formattedTime;
  if (!formattedTime) return formattedDate;

  return `${formattedDate} à ${formattedTime}`;
};

/**
 * Calcule l'âge à partir d'une date de naissance
 * @param {string|Date} birthDate - Date de naissance
 * @returns {number} Âge en années
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return 0;

  const today = new Date();
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;

  if (isNaN(birth.getTime())) return 0;

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Vérifie si une date est aujourd'hui
 * @param {string|Date} date - Date à vérifier
 * @returns {boolean} True si c'est aujourd'hui
 */
export const isToday = (date) => {
  if (!date) return false;

  const today = new Date();
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return false;

  return today.toDateString() === dateObj.toDateString();
};

/**
 * Vérifie si une date est demain
 * @param {string|Date} date - Date à vérifier
 * @returns {boolean} True si c'est demain
 */
export const isTomorrow = (date) => {
  if (!date) return false;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return false;

  return tomorrow.toDateString() === dateObj.toDateString();
};

/**
 * Retourne une date relative (aujourd'hui, demain, hier, etc.)
 * @param {string|Date} date - Date à formatter
 * @returns {string} Date relative
 */
export const getRelativeDate = (date) => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

  if (isToday(dateObj)) return "Aujourd'hui";
  if (isTomorrow(dateObj)) return "Demain";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === dateObj.toDateString()) {
    return "Hier";
  }

  // Si c'est dans la semaine courante
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  if (dateObj >= startOfWeek && dateObj <= endOfWeek) {
    return dateObj.toLocaleDateString("fr-FR", { weekday: "long" });
  }

  // Sinon, format normal
  return formatDate(dateObj);
};

/**
 * Formate une durée en minutes vers un format lisible
 * @param {number} minutes - Durée en minutes
 * @returns {string} Durée formatée
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return "0 min";

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`;
};

/**
 * Calcule le temps écoulé depuis une date
 * @param {string|Date} date - Date de référence
 * @returns {string} - Temps écoulé formaté
 */
export const getTimeElapsed = (date) => {
  if (!date) return "Temps inconnu";
  const dateObj = new Date(date);
  const now = new Date();
  const diffMs = now - dateObj;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}j`;
  if (diffHours > 0) return `${diffHours}h`;
  return `${diffMinutes}min`;
};

// Export par défaut d'un objet avec toutes les fonctions
export default {
  formatDate,
  formatDateShort,
  formatTime,
  formatDateTime,
  calculateAge,
  isToday,
  isTomorrow,
  getRelativeDate,
  formatDuration,
  getTimeElapsed,
};
