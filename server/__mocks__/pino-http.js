// Mock pour pino-http
module.exports = jest.fn().mockImplementation(() => {
  return (req, res, next) => {
    req.log = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockReturnThis()
    };
    next();
  };
});