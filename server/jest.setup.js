// Configuration Jest pour les tests
// Ce fichier est exécuté avant chaque suite de tests

// Importer les fonctions de Jest nécessaires
const { afterAll } = require('@jest/globals');

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

// Helper pour nettoyer la base de données entre les tests
global.cleanupTestData = async () => {
  // Cette fonction peut être utilisée dans les tests pour nettoyer les données
  if (process.env.NODE_ENV === "test") {
    // Logique de nettoyage ici si nécessaire
  }
};

// La fermeture de la connexion MongoDB est gérée dans jest.teardown.js
