function requireJson(req, res, next) {
  if (req.is('application/json')) return next();
  return res.status(415).json({ error: { message: 'Content-Type must be application/json' } });
}
module.exports = { requireJson };
