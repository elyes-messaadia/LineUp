/**
 * Utilitaires pour le formatage des dates et heures
 */

/**
 * Formate une date en format français HH:MM
 * @param {string|Date} date - Date à formater
 * @returns {string} - Heure formatée
 */
export const formatTime = (date) => {
  if (!date) return "Date inconnue";
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "Date invalide";
  
  return dateObj.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formate une date complète en français
 * @param {string|Date} date - Date à formater
 * @returns {string} - Date formatée
 */
export const formatDate = (date) => {
  if (!date) return "Date inconnue";
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "Date invalide";
  
  return dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formate une date avec heure complète
 * @param {string|Date} date - Date à formater
 * @returns {string} - Date et heure formatées
 */
export const formatDateTime = (date) => {
  if (!date) return "Date inconnue";
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "Date invalide";
  
  return dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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