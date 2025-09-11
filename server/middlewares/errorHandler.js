const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log structured error (redaction configured in logger)
  logger.error({ err, url: req.originalUrl, method: req.method, ip: req.ip }, 'Middleware global d\'erreur');

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors
    });
  }

  // Erreur de duplication MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} déjà existant`
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }

  // Erreur par défaut
  const publicMessage = process.env.NODE_ENV === 'development' ? (err.message || 'Erreur serveur interne') : 'Erreur serveur interne';
  const statusCode = err.statusCode || 500;

  const response = { success: false, message: publicMessage };
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
