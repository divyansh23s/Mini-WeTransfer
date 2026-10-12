const crypto = require('crypto');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith('generate-a-unique-random-secret') || secret.startsWith('replace-with-a-long-random-secret')) {
    throw new Error('JWT_SECRET must be set to a unique random value of at least 32 characters');
  }
  return secret;
}

function createOpaqueToken() { return crypto.randomBytes(32).toString('base64url'); }
function hashToken(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
module.exports = { getJwtSecret, createOpaqueToken, hashToken };
