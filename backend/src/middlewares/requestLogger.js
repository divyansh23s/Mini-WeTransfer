const { randomUUID } = require('crypto');
const logger = require('../config/logger');

function safePathForLog(path, method) {
  if (path.startsWith('/api/links/')) {
    const parts = path.split('/');
    if (parts.length === 4 && method === 'GET') return '/api/links/:token';
    if (parts.length === 4 && method === 'DELETE') return '/api/links/:linkId';
  }
  return path;
}

function requestLogger(req, res, next) {
  const requestId = randomUUID();
  const startedAt = process.hrtime.bigint();
  const requestPath = safePathForLog(req.path, req.method);
  res.setHeader('X-Request-Id', requestId);
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const details = {
      requestId,
      method: req.method,
      path: requestPath,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs)
    };
    if (res.statusCode >= 400) logger.warn('http request completed with error status', details);
    else logger.info('http request completed', details);
  });
  next();
}

module.exports = requestLogger;
module.exports.safePathForLog = safePathForLog;
