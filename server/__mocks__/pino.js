// Mock du logger pour les tests (pino doit être une fonction)
const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
  child: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
  getSubLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
});

const pino = jest.fn(() => createMockLogger());

// Fournir stdTimeFunctions utilisé par logger.js
pino.stdTimeFunctions = {
  isoTime: jest.fn(),
};

module.exports = pino;