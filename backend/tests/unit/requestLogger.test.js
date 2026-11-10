const { safePathForLog } = require('../../src/middlewares/requestLogger');

test('access logs redact bearer tokens and link ids from URLs', () => {
  expect(safePathForLog(`/api/links/${'A'.repeat(43)}`, 'GET')).toBe('/api/links/:token');
  expect(safePathForLog('/api/links/507f1f77bcf86cd799439011', 'DELETE')).toBe('/api/links/:linkId');
});
