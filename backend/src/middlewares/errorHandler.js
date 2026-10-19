const logger = require('../config/logger');

function notFound(req, res) {
  res.status(404).json({ error: { message: 'Route not found' } });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.statusCode || (err.code === 'LIMIT_FILE_SIZE' ? 413 : err.name === 'MulterError' ? 400 : 500);
  if (status >= 500) {
    logger.error('request failed', {
      method: req.method,
      path: req.path,
      message: err.message,
      stack: err.stack
    });
  }
  const safeMessage = err.code === 'LIMIT_FILE_SIZE'
    ? 'File exceeds the configured upload size limit'
    : status >= 500 ? 'An unexpected error occurred' : err.message;
  res.status(status).json({ error: { message: safeMessage } });
}

module.exports = { notFound, errorHandler };
