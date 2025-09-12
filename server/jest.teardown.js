// Configuration pour nettoyer après tous les tests
const mongoose = require("mongoose");

module.exports = async () => {
  // Fermer toutes les connexions MongoDB
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("MongoDB disconnected after all tests");
  }
};
