const request = require('supertest');
const mongoose = require('mongoose');
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
const app = require('../../src/app');

test('health reports the API while MongoDB is disconnected', async () => {
  mongoose.connection.readyState = 0;
  const response = await request(app).get('/health');
  expect(response.status).toBe(503);
  expect(response.body.message).toBe('API is running');
});

test('protected file routes reject requests without a Bearer token', async () => {
  const response = await request(app).get('/api/files');
  expect(response.status).toBe(401);
  expect(response.body.error.message).toBe('A Bearer token is required');
});
