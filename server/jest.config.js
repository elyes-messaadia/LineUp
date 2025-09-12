module.exports = {
  // Environnement de test
  testEnvironment: 'node',
  
  // Définir les variables d'environnement pour les tests
  setupFiles: ['<rootDir>/jest.setup.js'],
  
  // Ignorer les dossiers node_modules
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Correspondance des fichiers de test
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Configuration de coverage
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/scripts/**',
    '!jest.config.js',
    '!jest.setup.js'
  ],
  
  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Format des rapports de couverture
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Timeout pour les tests (en millisecondes)
  testTimeout: 30000,
  
  // Répertoire de sortie pour les rapports de coverage
  coverageDirectory: 'coverage',
  
  // Options pour verbose output
  verbose: true
};