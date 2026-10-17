const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/security');
const logger = require('../config/logger');

async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    logger.warn('authentication token missing', { ip: req.ip, path: req.baseUrl || 'protected-route' });
    return res.status(401).json({ error: { message: 'A Bearer token is required' } });
  }
  try {
    const payload = jwt.verify(token, getJwtSecret(), { issuer: 'mini-wetransfer' });
    const user = await User.findById(payload.sub).select('_id name email');
    if (!user) return res.status(401).json({ error: { message: 'The account for this token no longer exists' } });
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
      logger.warn('invalid bearer token', { ip: req.ip, path: req.baseUrl || 'protected-route' });
      return res.status(401).json({ error: { message: 'The token is invalid or expired' } });
    }
    return next(error);
  }
}
module.exports = { requireAuth };

