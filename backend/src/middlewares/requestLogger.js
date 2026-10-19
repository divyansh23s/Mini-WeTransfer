
const logger = require('../config/logger');

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
