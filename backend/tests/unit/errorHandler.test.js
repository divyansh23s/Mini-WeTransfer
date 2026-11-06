const { errorHandler } = require('../../src/middlewares/errorHandler');
jest.mock('../../src/config/logger', () => ({ error: jest.fn(), warn: jest.fn(), info: jest.fn() }));

test('internal errors return a generic message without exposing their stack', () => {
  const res = { headersSent: false, status: jest.fn().mockReturnThis(), json: jest.fn() };
  errorHandler(new Error('database password leaked'), { method: 'GET', path: '/private' }, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({ error: { message: 'An unexpected error occurred' } });
});
