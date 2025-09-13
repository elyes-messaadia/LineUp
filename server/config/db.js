const mongoose = require("mongoose");
const logger = require("../utils/logger");
require("dotenv").config();

async function connectDB(uri = process.env.MONGO_URI) {
  try {
    // Options de connexion optimisées
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      // Taille du pool de connexions réduite en test
      maxPoolSize: process.env.NODE_ENV === "test" ? 1 : 10,
      // Ne pas bloquer le processus Node.js
      bufferCommands: false,
    };

    // Base de données dédiée pour les tests
    if (process.env.NODE_ENV === "test") {
      options.dbName = "lineup-test";
    }

    await mongoose.connect(uri, options);

    if (process.env.NODE_ENV !== "test") {
      logger.info("✅ Connexion MongoDB réussie");
      // Détails de connexion en développement
      if (process.env.NODE_ENV === "development") {
        logger.debug(
          {
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name,
          },
          "Détails connexion MongoDB"
        );
      }
    }

    // Gestion des événements de connexion
    mongoose.connection.on("error", (err) => {
      logger.error(err, "❌ Erreur MongoDB");
    });

    mongoose.connection.on("disconnected", () => {
      if (process.env.NODE_ENV !== "test") {
        logger.warn("🔌 Déconnexion MongoDB");
      }
    });

    // Fermeture propre
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        logger.info("MongoDB déconnecté (SIGINT)");
        process.exit(0);
      } catch (err) {
        logger.error(err, "Erreur de fermeture MongoDB");
        process.exit(1);
      }
    });
  } catch (err) {
    logger.error(err, "❌ Erreur de connexion MongoDB");
    if (process.env.NODE_ENV === "test") throw err;
    if (process.env.NODE_ENV === "production") process.exit(1);
  }
}

// Helper pour la déconnexion (tests)
async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      if (process.env.NODE_ENV !== "test") {
        logger.info("MongoDB déconnecté proprement");
      }
    }
  } catch (err) {
    logger.error(err, "Erreur de déconnexion MongoDB");
    throw err;
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  mongoose, // Pour les tests
};
