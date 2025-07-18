// AuthService unit tests
// Separate file from server.test.js to avoid errors 

jest.mock('../src/config/firebase', () => ({
  auth: {
    createUser: jest.fn(),
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
  }
}));
jest.mock('../src/data/mockData', () => ({
  createUser: jest.fn(),
  getUser: jest.fn(),
}));

const AuthService = require('../src/services/authService');
const auth = require('../src/config/firebase').auth;
const mockData = require('../src/data/mockData');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthService', () => {
  describe('registerUser', () => {
    // Test: Reguster user and create profile
    it('should register a user and create profile', async () => {
      auth.createUser.mockResolvedValue({ uid: 'fakeUid', email: 'fakeUid@example.com' });
      mockData.createUser.mockReturnValue({ profile: { fullName: 'Test' } });
      const result = await AuthService.registerUser('fakeUid@example.com', 'Test123!');
      // Expected calls
      expect(auth.createUser).toHaveBeenCalledWith({ email: 'fakeUid@example.com', password: 'Test123!', emailVerified: false });
      expect(mockData.createUser).toHaveBeenCalledWith('fakeUid', expect.any(Object));
      expect(result).toEqual({
        success: true,
        user: {
          uid: 'fakeUid',
          email: 'fakeUid@example.com',
          profile: { fullName: 'Test' }
        }
      });
    });
    // Test: Email already exists error
    it('should throw Email already exists error', async () => {
      const error = new Error('x');
      error.code = 'auth/email-already-exists';
      auth.createUser.mockRejectedValue(error);
      // Expected error
      await expect(AuthService.registerUser('fakeUid@example.com', 'Test123!')).rejects.toThrow('Email already exists');
    });
    // Test: Generic registration error
    it('should throw generic registration error', async () => {
      auth.createUser.mockRejectedValue(new Error('fail'));
      // Expected error
      await expect(AuthService.registerUser('fakeUid@example.com', 'Test123!')).rejects.toThrow('Registration failed');
    });
  });

  describe('verifyFirebaseToken', () => {
    // Test: Verify token and return decoded info
    it('should verify token and return decoded info', async () => {
      auth.verifyIdToken.mockResolvedValue({ uid: 'user' });
      const result = await AuthService.verifyFirebaseToken('token');
      // Expected calls
      expect(auth.verifyIdToken).toHaveBeenCalledWith('token');
      expect(result).toEqual({ uid: 'user' });
    });
    // Test: Verify token fails
    it('should throw if verifyIdToken fails', async () => {
      auth.verifyIdToken.mockRejectedValue(new Error('bad token'));
      // Expected error
      await expect(AuthService.verifyFirebaseToken('token')).rejects.toThrow('bad token');
    });
  });

  describe('getUserByUid', () => {
    // Test: User found in mockData
    it('should return user from mockData if found', async () => {
      // Expected calls
      mockData.getUser.mockReturnValue({ uid: 'fakeUser', email: 'fakeUser@example.com', role: 'admin', profile: { fullName: 'Test' } });
      const result = await AuthService.getUserByUid('fakeUser');
      // Expected calls
      expect(mockData.getUser).toHaveBeenCalledWith('fakeUser');
      expect(result).toEqual({ uid: 'fakeUser', email: 'fakeUser@example.com', role: 'admin', profile: { fullName: 'Test' } });
    });
    // Test: User not found in mockData
    it('should return default profile if not found in mockData', async () => {
      mockData.getUser.mockReturnValue(undefined);
      auth.getUser.mockResolvedValue({ email: 'fake@example.com' });
      const result = await AuthService.getUserByUid('user2');
      // Expected calls
      expect(auth.getUser).toHaveBeenCalledWith('user2');
      expect(result).toEqual({
        uid: 'user2',
        email: 'fake@example.com',
        role: 'volunteer',
        profile: expect.objectContaining({ fullname: 'Not in mockdata user' })
      });
    });
  });
});
