// auth.js unit tests 
// Separate file from server.test.js to avoid errors 

jest.mock('firebase-admin', () => {
  const verifyIdToken = jest.fn();
  return {
    auth: () => ({ verifyIdToken })
  };
});

const { verifyToken } = require('../src/middleware/auth');

describe('verifyToken middleware', () => {
  let req, res, next;
  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  // Test: No token provided
  it('should return 401 if no token is provided', async () => {
    await verifyToken(req, res, next);
    // Expected status code and error
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  // Test: Token is invalid
  it('should return 401 if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalidtoken';
    const admin = require('firebase-admin');
    admin.auth().verifyIdToken.mockRejectedValue(new Error('bad token'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await verifyToken(req, res, next);
    // Expected status code and error
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(consoleSpy).toHaveBeenCalledWith('Token verification failed: ', expect.any(Error));
    expect(next).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // Test: Token is valid
  it('should call next and set req.user if token is valid', async () => {
    req.headers.authorization = 'Bearer validtoken';
    const admin = require('firebase-admin');
    const fakeUser = { uid: 'user1', email: 'test@example.com' };
    admin.auth().verifyIdToken.mockResolvedValue(fakeUser);
    await verifyToken(req, res, next);
    // Expected req.user and next call
    expect(req.user).toEqual(fakeUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
