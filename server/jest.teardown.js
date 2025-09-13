// Configuration pour nettoyer après tous les tests
const { disconnectDB } = require("./config/db");

module.exports = async () => {
  // Utiliser la fonction de déconnexion optimisée
  await disconnectDB();
};
