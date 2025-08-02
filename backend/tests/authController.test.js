const request = require('supertest');
const express = require('express');
const app = express();
const AuthController = require('../src/controllers/authController');
const authService = require('../src/services/authService');
const supabase = require('../src/config/databaseBackend');

// Mock dependencies
jest.mock('../src/services/authService');
jest.mock('../src/config/databaseBackend');

app.use(express.json());
app.post('/register', AuthController.register);
app.post('/login', AuthController.login);
app.get('/current-user', AuthController.getCurrentUser);

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const mockUser = {
        success: true,
        user: { uid: '123', email: 'test@example.com', role: 'volunteer' }
      };
      authService.registerUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'User registered successfully',
        user: mockUser
      });
      expect(authService.registerUser).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/register')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Registration failed',
        message: 'Password is required'
      });
    });

    it('should handle email already exists error', async () => {
      authService.registerUser.mockRejectedValue(new Error('Email already exists'));

      const response = await request(app)
        .post('/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: 'Registration failed',
        message: 'Email already exists'
      });
    });

    it('should handle other registration errors', async () => {
      authService.registerUser.mockRejectedValue(new Error('Some error'));

      const response = await request(app)
        .post('/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Registration failed',
        message: 'Some error'
      });
    });
  });

  describe('login', () => {
    it('should login successfully with valid token', async () => {
      authService.verifyFirebaseToken.mockResolvedValue({ uid: '123' });
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { uid: '123', email: 'test@example.com', role: 'volunteer' },
          error: null
        })
      });

      const response = await request(app)
        .post('/login')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Login successful',
        uid: '123',
        email: 'test@example.com',
        role: 'volunteer',
        admin: false
      });
    });

    it('should return 400 for missing/invalid Authorization header', async () => {
      const response1 = await request(app).post('/login');
      expect(response1.status).toBe(400);

      const response2 = await request(app)
        .post('/login')
        .set('Authorization', 'Invalid');
      expect(response2.status).toBe(400);
    });

    it('should return 404 if user not found in database', async () => {
      authService.verifyFirebaseToken.mockResolvedValue({ uid: '123' });
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      });

      const response = await request(app)
        .post('/login')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found in database' });
    });

    it('should return 401 for invalid token', async () => {
      authService.verifyFirebaseToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/login')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user info with profile', async () => {
      const mockReq = { user: { uid: '123' } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { uid: '123', email: 'test@example.com', role: 'admin' },
              error: null
            })
          };
        }
        if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { fullName: 'Test User' },
              error: null
            })
          };
        }
      });

      await AuthController.getCurrentUser(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        user: {
          uid: '123',
          email: 'test@example.com',
          role: 'admin',
          profile: { fullName: 'Test User' }
        }
      });
    });

    it('should return current user info without profile if not found', async () => {
      const mockReq = { user: { uid: '123' } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      supabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { uid: '123', email: 'test@example.com', role: 'volunteer' },
              error: null
            })
          };
        }
        if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          };
        }
      });

      await AuthController.getCurrentUser(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        user: {
          uid: '123',
          email: 'test@example.com',
          role: 'volunteer',
          profile: null
        }
      });
    });

    it('should return 404 if user not found', async () => {
      const mockReq = { user: { uid: '123' } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      await AuthController.getCurrentUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found in database' });
    });

    it('should return 500 for database errors', async () => {
      const mockReq = { user: { uid: '123' } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      });

      await AuthController.getCurrentUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });
});