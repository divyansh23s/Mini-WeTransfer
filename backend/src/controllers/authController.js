const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/security');
const logger = require('../config/logger');

const BCRYPT_ROUNDS = 12;
const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '1d';

async function register(req, res, next) {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body.password;
    if (name.length < 2 || name.length > 80) return res.status(400).json({ error: { message: 'Name must be 2 to 80 characters' } });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: { message: 'Enter a valid email address' } });
    if (typeof password !== 'string' || password.length < 10 || password.length > 72) {
      return res.status(400).json({ error: { message: 'Password must be 10 to 72 characters' } });
    }
    if (await User.exists({ email })) return res.status(409).json({ error: { message: 'An account with this email already exists' } });

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ name, email, passwordHash });
    const token = jwt.sign({}, getJwtSecret(), { subject: user.id, expiresIn: TOKEN_TTL, issuer: 'mini-wetransfer' });
    return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, token, tokenType: 'Bearer', expiresIn: TOKEN_TTL });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: { message: 'An account with this email already exists' } });
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body.password;
    const user = await User.findOne({ email }).select('+passwordHash');
    const valid = user && typeof password === 'string' && await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      logger.warn('login rejected', { ip: req.ip });
      return res.status(401).json({ error: { message: 'Invalid email or password' } });
    }
    const token = jwt.sign({}, getJwtSecret(), { subject: user.id, expiresIn: TOKEN_TTL, issuer: 'mini-wetransfer' });
    return res.json({ user: { id: user.id, name: user.name, email: user.email }, token, tokenType: 'Bearer', expiresIn: TOKEN_TTL });
  } catch (error) { return next(error); }
}

module.exports = { register, login };
