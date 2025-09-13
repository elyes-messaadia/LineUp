// Configuration Jest pour les tests
// Ce fichier est exécuté avant chaque suite de tests

// Importer les fonctions de Jest nécessaires
const { afterAll } = require("@jest/globals");

// Définir les variables d'environnement pour les tests
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-purposes-only";
process.env.MONGODB_URI = "mongodb://localhost:27017/lineup-test";
process.env.PORT = "5001";
process.env.LOG_LEVEL = "silent";

// Augmenter le timeout pour les tests async
jest.setTimeout(30000);

// Configuration globale pour les mocks
global.console = {
  ...console,
  // Réduire le bruit dans les tests mais garder les erreurs importantes
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Mock des modules externes si nécessaire
jest.mock("web-push", () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock des loggers et autres dépendances pour les tests
jest.mock("pino");
jest.mock("pino-http");

// Helper pour nettoyer la base de données entre les tests
const { mongoose } = require("./config/db");

global.cleanupTestData = async () => {
  if (process.env.NODE_ENV === "test") {
    // S'assurer que nous sommes connectés à la base de test
    const dbName = mongoose.connection.name;
    if (dbName !== "lineup-test") {
      throw new Error(`Tentative de nettoyage sur une base non-test : ${dbName}`);
    }

    // Nettoyer toutes les collections
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
};

// La fermeture de la connexion MongoDB est gérée dans jest.teardown.js
