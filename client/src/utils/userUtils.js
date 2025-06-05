/**
 * Utilitaires pour gérer l'affichage des noms d'utilisateur
 */

/**
 * Obtient le nom d'affichage pour un utilisateur
 * @param {Object} user - Objet utilisateur
 * @returns {string} - Nom à afficher
 */
export function getDisplayName(user) {
  if (!user) return 'Utilisateur';
  
  // Priorité au fullName calculé côté serveur
  if (user.fullName && user.fullName !== user.email) {
    return user.fullName;
  }
  
  // Construire le nom à partir des composants
  const firstName = user.firstName || user.profile?.firstName;
  const lastName = user.lastName || user.profile?.lastName;
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  
  if (firstName) {
    return firstName;
  }
  
  if (lastName) {
    return lastName;
  }
  
  // Fallback vers l'email (partie avant @)
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Utilisateur';
}

/**
 * Obtient le message de bienvenue personnalisé
 * @param {Object} user - Objet utilisateur  
 * @param {string} prefix - Préfixe (ex: "Bienvenue", "Bonjour")
 * @returns {string} - Message complet
 */
export function getWelcomeMessage(user, prefix = 'Bienvenue') {
  const displayName = getDisplayName(user);
  return `${prefix} ${displayName}`;
}

/**
 * Debug : Affiche les informations utilisateur pour diagnostiquer les problèmes
 * @param {Object} user - Objet utilisateur
 */
export function debugUserData(user) {
  console.group('🔍 Debug User Data');
  console.log('Raw user object:', user);
  console.log('user.fullName:', user?.fullName);
  console.log('user.firstName:', user?.firstName);
  console.log('user.lastName:', user?.lastName);
  console.log('user.profile?.firstName:', user?.profile?.firstName);
  console.log('user.profile?.lastName:', user?.profile?.lastName);
  console.log('user.email:', user?.email);
  console.log('Display name result:', getDisplayName(user));
  console.groupEnd();
}

/**
 * Nettoie les données utilisateur en localStorage
 */
export function cleanupUserData() {
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      debugUserData(user);
      
      // Si les données semblent corrompues, les supprimer
      if (!user.email) {
        console.warn('🗑️ Données utilisateur corrompues, nettoyage...');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('❌ Erreur parsing user data:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      return null;
    }
  }
  return null;
} 