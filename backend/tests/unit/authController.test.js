const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const { login, register } = require('../../src/controllers/authController');

jest.mock('bcryptjs', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn(() => 'signed.test.token') }));
jest.mock('../../src/models/User', () => ({ exists: jest.fn(), create: jest.fn(), findOne: jest.fn() }));
jest.mock('../../src/config/logger', () => ({ warn: jest.fn(), info: jest.fn(), error: jest.fn() }));

function response() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('authentication controller', () => {
  beforeEach(() => { process.env.JWT_SECRET = 'unit-test-secret-value-with-at-least-32-chars'; });

  test('login returns JWT after password verification', async () => {
    const user = { id: 'user-1', name: 'Ada', email: 'ada@example.com', passwordHash: 'stored-hash' };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    bcrypt.compare.mockResolvedValue(true);
    const res = response();
    await login({ body: { email: 'ADA@example.com', password: 'correct-password' } }, res, jest.fn());
    expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', 'stored-hash');
    expect(jwt.sign).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'signed.test.token' }));
  });

  test('login rejects an incorrect password', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ passwordHash: 'stored-hash' }) });
    bcrypt.compare.mockResolvedValue(false);
    const res = response();
    await login({ body: { email: 'ada@example.com', password: 'wrong-password' }, ip: '127.0.0.1' }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('registration stores a bcrypt hash, never the submitted password', async () => {
    User.exists.mockResolvedValue(false);
    bcrypt.hash.mockResolvedValue('bcrypt-hash');
    User.create.mockResolvedValue({ id: 'user-2', name: 'Ada', email: 'ada@example.com' });
    const res = response();
    await register({ body: { name: 'Ada', email: 'ADA@example.com', password: 'long-password' } }, res, jest.fn());
    expect(User.create).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@example.com', passwordHash: 'bcrypt-hash' });
    expect(User.create.mock.calls[0][0]).not.toHaveProperty('password');
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
