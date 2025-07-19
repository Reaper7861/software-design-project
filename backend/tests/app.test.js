// app.js unit tests 
// Separate file from server.test.js to avoid errors 

const request = require('supertest');
const app = require('../src/app');

describe('app.js branch coverage', () => {
  afterAll(() => {
    delete process.env.NODE_ENV;
  });

  // Test: Error with status and message
  it('handles error with status and message', async () => {
    process.env.NODE_ENV = 'test';
    const res = await request(app).get('/test-error?type=custom-status');
    expect(res.status).toBe(418);
    expect(res.body).toHaveProperty('error', 'Boom!');
    expect(res.body).not.toHaveProperty('stack');
  });

  // Test: Error with no status or message
  it('handles error with no status or message', async () => {
    process.env.NODE_ENV = 'test';
    const res = await request(app).get('/test-error?type=no-message');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal Server Error');
    expect(res.body).not.toHaveProperty('stack');
  });

  // Test: Stack in development mode
  it('includes stack in development mode', async () => {
    process.env.NODE_ENV = 'development';
    const res = await request(app).get('/test-error');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Dev error');
    expect(res.body).toHaveProperty('stack');
  });
});
