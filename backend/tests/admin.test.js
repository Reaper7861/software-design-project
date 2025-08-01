const request = require('supertest');
const express = require('express');
const app = express();
const adminRouter = require('../src/routes/adminRoutes');
const supabase = require('../src/config/databaseBackend');

// Mock dependencies
jest.mock('../src/config/databaseBackend', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis()
}));

jest.mock('../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { uid: 'admin-uid', role: 'administrator' };
    next();
  }
}));

app.use(express.json());
app.use('/api/admin', adminRouter);

describe('Admin Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should fetch all users with profile info', async () => {
      const mockUsers = [
        {
          uid: 'user1',
          fullName: 'User One',
          usercredentials: { email: 'user1@test.com', role: 'volunteer' }
        }
      ];

      supabase.order.mockResolvedValueOnce({
        data: mockUsers,
        error: null
      });

      const response = await request(app).get('/api/admin/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        users: [{
          uid: 'user1',
          fullName: 'User One',
          email: 'user1@test.com',
          role: 'volunteer'
        }]
      });
      expect(supabase.from).toHaveBeenCalledWith('userprofile');
      expect(supabase.select).toHaveBeenCalledWith('uid, fullName, usercredentials(email, role)');
    });

    it('should handle database errors', async () => {
      supabase.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const response = await request(app).get('/api/admin/users');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch users' });
    });

    it('should handle missing usercredentials', async () => {
      const mockUsers = [
        {
          uid: 'user2',
          fullName: 'User Two',
          usercredentials: null
        }
      ];

      supabase.order.mockResolvedValueOnce({
        data: mockUsers,
        error: null
      });

      const response = await request(app).get('/api/admin/users');

      expect(response.status).toBe(200);
      expect(response.body.users[0].email).toBe('');
      expect(response.body.users[0].role).toBe('volunteer');
    });
  });

  describe('PATCH /api/admin/users/:uid/role', () => {
    const validRequest = { role: 'administrator' };
    const mockUpdatedUser = {
      uid: 'user1',
      role: 'administrator'
    };

    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
      supabase.from.mockReturnThis();
      supabase.update.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.select.mockReturnThis();
    });

    it('should update user role successfully', async () => {
      // Mock successful update
      supabase.select.mockResolvedValueOnce({
        data: [mockUpdatedUser],
        error: null
      });

      const response = await request(app)
        .patch('/api/admin/users/user1/role')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Role updated to administrator',
        user: mockUpdatedUser
      });
      expect(supabase.from).toHaveBeenCalledWith('usercredentials');
      expect(supabase.update).toHaveBeenCalledWith({ role: 'administrator' });
      expect(supabase.eq).toHaveBeenCalledWith('uid', 'user1');
      expect(supabase.select).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Mock database error
      supabase.select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      });

      const response = await request(app)
        .patch('/api/admin/users/user1/role')
        .send(validRequest);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update role' });
    });

    it('should reject invalid roles', async () => {
      const response = await request(app)
        .patch('/api/admin/users/user1/role')
        .send({ role: 'invalid-role' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid role' });
    });

    it('should handle user not found', async () => {
      // Mock empty response
      supabase.select.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const response = await request(app)
        .patch('/api/admin/users/user1/role')
        .send(validRequest);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });
  });

  describe('GET /api/admin/events', () => {
    it('should fetch all events', async () => {
      const mockEvents = [
        { id: 1, name: 'Event 1', eventdate: '2023-01-01' }
      ];

      supabase.order.mockResolvedValueOnce({
        data: mockEvents,
        error: null
      });

      const response = await request(app).get('/api/admin/events');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ events: mockEvents });
      expect(supabase.from).toHaveBeenCalledWith('eventdetails');
    });

    it('should handle database errors', async () => {
      supabase.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const response = await request(app).get('/api/admin/events');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch events' });
    });
  });
});