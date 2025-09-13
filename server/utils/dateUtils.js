/**
 * 📅 Utilitaires de gestion des dates pour le serveur LineUp
 * Fonctions communes pour formater et manipuler les dates
 */

class DateUtils {
  /**
   * 📅 Formate une date en français
   */
  static formatDate(date, options = {}) {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };

    return dateObj.toLocaleDateString('fr-FR', defaultOptions);
  }

  /**
   * ⏰ Formate une heure
   */
  static formatTime(date, options = {}) {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };

    return dateObj.toLocaleTimeString('fr-FR', defaultOptions);
  }

  /**
   * 📅⏰ Formate date et heure
   */
  static formatDateTime(date) {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    return `${this.formatDate(dateObj)} à ${this.formatTime(dateObj)}`;
  }

  /**
   * ⏳ Calcule la différence en minutes
   */
  static getDifferenceInMinutes(date1, date2) {
    const diff = Math.abs(new Date(date1) - new Date(date2));
    return Math.floor(diff / (1000 * 60));
  }

  /**
   * 📊 Formate une durée en texte lisible
   */
  static formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} heure${hours > 1 ? 's' : ''}`;
    }
    
    return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
  }

  /**
   * 🗓️ Vérifie si une date est aujourd'hui
   */
  static isToday(date) {
    const today = new Date();
    const dateObj = new Date(date);
    
    return dateObj.toDateString() === today.toDateString();
  }

  /**
   * 📅 Vérifie si une date est demain
   */
  static isTomorrow(date) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateObj = new Date(date);
    
    return dateObj.toDateString() === tomorrow.toDateString();
  }

  /**
   * 🕐 Obtient l'heure actuelle formatée
   */
  static getCurrentTime() {
    return this.formatTime(new Date());
  }

  /**
   * 📅 Obtient la date actuelle formatée
   */
  static getCurrentDate() {
    return this.formatDate(new Date());
  }

  /**
   * ⏰ Ajoute des minutes à une date
   */
  static addMinutes(date, minutes) {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  /**
   * 📊 Génère un timestamp lisible pour les logs
   */
  static getLogTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * 🌅 Détermine la période de la journée
   */
  static getPeriodOfDay(date = new Date()) {
    const hour = new Date(date).getHours();
    
    if (hour < 6) return 'nuit';
    if (hour < 12) return 'matin';
    if (hour < 18) return 'après-midi';
    return 'soir';
  }

  /**
   * 👋 Génère un salut approprié selon l'heure
   */
  static getGreeting(date = new Date()) {
    const period = this.getPeriodOfDay(date);
    
    switch (period) {
      case 'matin': return 'Bonjour';
      case 'après-midi': return 'Bonjour';
      case 'soir': return 'Bonsoir';
      case 'nuit': return 'Bonsoir';
      default: return 'Bonjour';
    }
  }

  /**
   * 📈 Calcule l'âge depuis une date de naissance
   */
  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * 📅 Génère une plage de dates
   */
  static getDateRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * 🗓️ Vérifie si c'est un jour ouvrable
   */
  static isBusinessDay(date = new Date()) {
    const day = new Date(date).getDay();
    return day >= 1 && day <= 5; // Lundi à Vendredi
  }

  /**
   * ⏰ Convertit une durée ISO en minutes
   */
  static parseDurationToMinutes(duration) {
    // Format: PT30M ou PT1H30M
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    
    return hours * 60 + minutes;
  }
}

module.exports = DateUtils;