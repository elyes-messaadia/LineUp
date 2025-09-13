// Mock pino doit être une fonction (comme le vrai pino)
const mockLogger = {
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
};

function pinoMock() {
  return mockLogger;
}

pinoMock.stdTimeFunctions = {
  isoTime: jest.fn(() => new Date().toISOString()),
};

module.exports = pinoMock;
