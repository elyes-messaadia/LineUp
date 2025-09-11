const errorHandler = (err, req, res, next) => {
  // Log minimal error info in production to avoid leaking sensitive data
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Erreur capturée:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else {
    console.error('❌ Erreur serveur:', { message: err.message, url: req.originalUrl, method: req.method });
  }

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
  // In production avoid echoing internal error messages
  const publicMessage = process.env.NODE_ENV === 'development' ? (err.message || 'Erreur serveur interne') : 'Erreur serveur interne';
  res.status(err.statusCode || 500).json({
    success: false,
    message: publicMessage
  });
};

module.exports = errorHandler;
