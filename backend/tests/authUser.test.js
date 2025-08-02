const request = require('supertest');

// Mock authService at the top level
jest.mock('../src/services/authService', () => ({
  registerUser: jest.fn(),
  verifyFirebaseToken: jest.fn()
}));

// Global mock for Supabase client
const mockSupabase = {
  from: jest.fn(),
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  upsert: jest.fn()
};

// Mock Firebase Admin SDK
const mockFirebase = {
  auth: {
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
    getUserByEmail: jest.fn(),
    setCustomUserClaims: jest.fn()
  }
};

// Mock the Supabase client - export it directly as the module
jest.mock('../src/config/databaseBackend', () => mockSupabase);

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => mockFirebase.auth),
  initializeApp: jest.fn(),
  apps: [],
  credential: {
    cert: jest.fn()
  }
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock axios for Firebase ID token verification
jest.mock('axios', () => ({
  get: jest.fn()
}));

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('Auth User', () => {
  let app;
  let mockAuthService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    mockFirebase.auth.createUser.mockResolvedValue({ uid: 'fakeUid' });
    mockAuthService = require('../src/services/authService');
    mockAuthService.registerUser.mockResolvedValue({ uid: 'fakeUid', email: 'fakeUid@example.com' });
    mockAuthService.verifyFirebaseToken.mockResolvedValue({ uid: 'fakeUid', email: 'fakeUid@example.com' });
    
    // Mock Firebase auth.verifyIdToken for verifyToken middleware
    mockFirebase.auth.verifyIdToken.mockResolvedValue({ uid: 'fakeUid', email: 'fakeUid@example.com' });
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('getCurrentUser', () => {
    beforeEach(() => {
      // Mock Supabase for getCurrentUser tests
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { uid: 'fakeUid', email: 'fakeUid@example.com', role: 'admin' },
              error: null
            })
          };
        } else if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          };
        }
        return mockSupabase;
      });
    });

    it('should return user info if found', async () => {
      const AuthController = require('../src/controllers/authController');
      const req = { user: { uid: 'fakeUid' } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await AuthController.getCurrentUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        user: {
          uid: 'fakeUid',
          email: 'fakeUid@example.com',
          role: 'admin',
          profile: null
        }
      });
    });
  });

  describe('requireAdmin middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = { user: { uid: 'fakeUid' } };
      res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      next = jest.fn();

      // Mock Supabase for admin middleware tests
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { uid: 'fakeUid', email: 'fakeUid@example.com', role: 'admin' },
              error: null
            })
          };
        }
        return mockSupabase;
      });
    });

    it('should return 403 if user is not admin', async () => {
      req.user = { uid: 'fakeUid' }; // Simulate req.user from verifyToken
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { uid: 'fakeUid', email: 'fakeUid@example.com', role: 'volunteer' },
              error: null
            })
          };
        }
        return mockSupabase;
      });
      const { requireAdmin } = require('../src/middleware/role');
      await requireAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({error: 'Access denied - administrators only.'});
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user is admin', async () => {
      req.user = { uid: 'fakeUid' }; // Simulate req.user from verifyToken
      const { requireAdmin } = require('../src/middleware/role');
      await requireAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('userRoutes tests', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        user: { uid: 'test-uid' },
        body: {
          fullName: 'Test User',
          address1: '123 Test St',
          city: 'Test City',
          state: 'TX',
          zipCode: '12345',
          skills: ['skill1', 'skill2'],
          preferences: 'test preferences',
          availability: ['Monday', 'Tuesday']
        }
      };
      res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    it('POST /api/users/create-profile returns 500 if updateUser fails', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { uid: 'test-uid', email: 'test@example.com' },
              error: null
            })
          };
        } else if (table === 'userprofile') {
          return {
            upsert: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          };
        }
        return mockSupabase;
      });

      // Test the actual route using supertest
      const app = require('../src/app');
      const response = await request(app)
        .post('/api/users/create-profile')
        .set('Authorization', 'Bearer testtoken')
        .send({ name: 'Fail Update' });
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database error' });
    });

    it('POST /api/users/create-profile returns 500 if createUser fails', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            }),
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          };
        }
        return mockSupabase;
      });

      // Test the actual route using supertest
      const app = require('../src/app');
      const response = await request(app)
        .post('/api/users/create-profile')
        .set('Authorization', 'Bearer testtoken')
        .send({ name: 'Fail Create' });
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to create user credentials', details: 'Database error' });
    });

    it('GET /api/users/profile returns 200 with profile undefined if user object is missing profile property', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { uid: 'test-uid', email: 'test@example.com' },
              error: null
            })
          };
        } else if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          };
        }
        return mockSupabase;
      });

      // Test the actual route using supertest
      const app = require('../src/app');
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer testtoken');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ 
        message: 'Token verified successfully', 
        profile: {
          uid: 'fakeUid',
          fullName: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          zipCode: '',
          skills: [],
          preferences: '',
          availability: [],
          profileCompleted: false
        }
      });
    });
  });
}); 