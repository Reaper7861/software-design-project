// authService.js unit tests
// Separate file from server.test.js to avoid errors 

const bcrypt = require('bcryptjs');

jest.mock('../src/config/firebase', () => ({
  auth: {
    createUser: jest.fn(),
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
  }
}));

// Create a mock Supabase instance that can be configured per test
const mockSupabase = {
  from: jest.fn()
};

jest.mock('../src/config/databaseBackend', () => mockSupabase);

const AuthService = require('../src/services/authService');
const auth = require('../src/config/firebase').auth;

beforeEach(() => {
  jest.clearAllMocks();
  
  // Default successful Firebase user creation
  auth.createUser.mockResolvedValue({ 
    uid: 'testUid', 
    email: 'test@example.com' 
  });
  
  // Reset mockSupabase to default behavior
  mockSupabase.from.mockReturnValue({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        data: [{ uid: 'testUid', email: 'test@example.com', role: 'volunteer' }],
        error: null
      }))
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { uid: 'fakeUser', email: 'fakeUser@example.com', role: 'admin' },
          error: null
        }))
      }))
    }))
  });
});

describe('AuthService', () => {
  describe('registerUser', () => {
    describe('Successful Registration', () => {
      it('should register a user and create profile', async () => {
        const result = await AuthService.registerUser('fakeUid@example.com', 'Test123!');
        
        // Expected calls
        expect(auth.createUser).toHaveBeenCalledWith({ 
          email: 'fakeUid@example.com', 
          password: 'Test123!', 
          emailVerified: false 
        });
        expect(result).toEqual({
          success: true,
          user: {
            uid: 'testUid',
            email: 'test@example.com',
            role: 'volunteer'
          }
        });
      });

      it('should successfully register a new user with custom role', async () => {
        mockSupabase.from.mockReturnValue({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              data: [{ uid: 'testUid', email: 'test@example.com', role: 'admin' }],
              error: null
            }))
          }))
        });

        const result = await AuthService.registerUser('test@example.com', 'password123', 'admin');
        
        expect(result.user.role).toBe('admin');
      });

      it('should hash password before storing', async () => {
        const hashSpy = jest.spyOn(bcrypt, 'hash');
        
        await AuthService.registerUser('test@example.com', 'password123');
        
        expect(hashSpy).toHaveBeenCalledWith('password123', 12);
        hashSpy.mockRestore();
      });
    });

    describe('Firebase Auth Errors', () => {
      it('should throw Email already exists error', async () => {
        const error = new Error('x');
        error.code = 'auth/email-already-exists';
        auth.createUser.mockRejectedValue(error);
        
        // Expected error
        await expect(AuthService.registerUser('fakeUid@example.com', 'Test123!')).rejects.toThrow('Email already exists');
      });

      it('should handle Firebase weak password error', async () => {
        const error = new Error('Weak password');
        error.code = 'auth/weak-password';
        auth.createUser.mockRejectedValue(error);

        await expect(
          AuthService.registerUser('test@example.com', 'weak')
        ).rejects.toThrow('Registration failed');
      });

      it('should handle Firebase invalid email error', async () => {
        const error = new Error('Invalid email');
        error.code = 'auth/invalid-email';
        auth.createUser.mockRejectedValue(error);

        await expect(
          AuthService.registerUser('invalid-email', 'password123')
        ).rejects.toThrow('Registration failed');
      });

      it('should throw generic registration error', async () => {
        auth.createUser.mockRejectedValue(new Error('fail'));
        
        // Expected error
        await expect(AuthService.registerUser('fakeUid@example.com', 'Test123!')).rejects.toThrow('Registration failed');
      });
    });

    describe('Database Errors', () => {
      it('should handle database duplicate email error (code 23505)', async () => {
        mockSupabase.from.mockReturnValue({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              data: null,
              error: { code: '23505', message: 'duplicate key value' }
            }))
          }))
        });

        await expect(
          AuthService.registerUser('test@example.com', 'password123')
        ).rejects.toThrow('Registration failed'); // Updated expectation
      });

      it('should handle other database errors', async () => {
        mockSupabase.from.mockReturnValue({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              data: null,
              error: { code: '23503', message: 'foreign key violation' }
            }))
          }))
        });

        await expect(
          AuthService.registerUser('test@example.com', 'password123')
        ).rejects.toThrow('Registration failed');
      });
    });
  });

  describe('verifyPassword', () => {
    describe('Successful Password Verification', () => {
      it('should verify correct password', async () => {
        const hashedPassword = await bcrypt.hash('correctPassword', 12);
        
        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { 
                  uid: 'testUid', 
                  email: 'test@example.com', 
                  password: hashedPassword 
                },
                error: null
              }))
            }))
          }))
        });

        const result = await AuthService.verifyPassword('test@example.com', 'correctPassword');
        
        expect(result.uid).toBe('testUid');
        expect(result.email).toBe('test@example.com');
      });
    });

    describe('Password Verification Errors', () => {
      it('should throw error for incorrect password', async () => {
        const hashedPassword = await bcrypt.hash('correctPassword', 12);
        
        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { 
                  uid: 'testUid', 
                  email: 'test@example.com', 
                  password: hashedPassword 
                },
                error: null
              }))
            }))
          }))
        });

        await expect(
          AuthService.verifyPassword('test@example.com', 'wrongPassword')
        ).rejects.toThrow('Invalid password');
      });

      it('should throw error when user not found', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { message: 'User not found' }
              }))
            }))
          }))
        });

        await expect(
          AuthService.verifyPassword('nonexistent@example.com', 'password123')
        ).rejects.toThrow('User not found');
      });
    });
  });

  describe('verifyFirebaseToken', () => {
    describe('Successful Token Verification', () => {
      it('should verify token and return decoded info', async () => {
        auth.verifyIdToken.mockResolvedValue({ uid: 'user' });
        const result = await AuthService.verifyFirebaseToken('token');
        
        // Expected calls
        expect(auth.verifyIdToken).toHaveBeenCalledWith('token');
        expect(result).toEqual({ uid: 'user' });
      });

      it('should verify valid Firebase token with full payload', async () => {
        const mockDecodedToken = {
          uid: 'testUid',
          email: 'test@example.com',
          iat: 1234567890
        };

        auth.verifyIdToken.mockResolvedValue(mockDecodedToken);

        const result = await AuthService.verifyFirebaseToken('valid-token');
        
        expect(auth.verifyIdToken).toHaveBeenCalledWith('valid-token');
        expect(result).toEqual(mockDecodedToken);
      });
    });

    describe('Token Verification Errors', () => {
      it('should throw if verifyIdToken fails', async () => {
        auth.verifyIdToken.mockRejectedValue(new Error('bad token'));
        
        // Expected error
        await expect(AuthService.verifyFirebaseToken('token')).rejects.toThrow('bad token');
      });

      it('should throw error for expired token', async () => {
        auth.verifyIdToken.mockRejectedValue(new Error('Token expired'));

        await expect(
          AuthService.verifyFirebaseToken('expired-token')
        ).rejects.toThrow('Token expired');
      });

      it('should throw error for malformed token', async () => {
        auth.verifyIdToken.mockRejectedValue(new Error('Malformed token'));

        await expect(
          AuthService.verifyFirebaseToken('malformed-token')
        ).rejects.toThrow('Malformed token');
      });
    });
  });

  describe('getUserByUid', () => {
    describe('Successful User Retrieval', () => {
      it('should return user from database if found', async () => {
        const result = await AuthService.getUserByUid('fakeUser');
        
        // Expected calls
        expect(result).toEqual({ uid: 'fakeUser', email: 'fakeUser@example.com', role: 'admin' });
      });

      it('should return user when found by UID with custom data', async () => {
        const mockUser = {
          uid: 'testUid',
          email: 'test@example.com',
          role: 'admin'
        };

        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockUser,
                error: null
              }))
            }))
          }))
        });

        const result = await AuthService.getUserByUid('testUid');
        
        expect(result).toEqual(mockUser);
      });
    });

    describe('User Not Found Errors', () => {
      it('should throw error if user not found', async () => {
        // Mock the database to return an error
        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { message: 'User not found' }
              }))
            }))
          }))
        });
        
        // Expected error
        await expect(AuthService.getUserByUid('nonexistent')).rejects.toThrow('User not found');
      });

      it('should throw error when user not found by UID', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { message: 'User not found' }
              }))
            }))
          }))
        });

        await expect(
          AuthService.getUserByUid('nonexistentUid')
        ).rejects.toThrow('User not found');
      });
    });
  });

  describe('getUserByEmail', () => {
    describe('Successful User Retrieval', () => {
      it('should return user from database if found', async () => {
        const result = await AuthService.getUserByEmail('fakeUser@example.com');
        
        // Expected calls
        expect(result).toEqual({ uid: 'fakeUser', email: 'fakeUser@example.com', role: 'admin' });
      });

      it('should return user when found by email with custom data', async () => {
        const mockUser = {
          uid: 'testUid',
          email: 'test@example.com',
          role: 'volunteer'
        };

        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockUser,
                error: null
              }))
            }))
          }))
        });

        const result = await AuthService.getUserByEmail('test@example.com');
        
        expect(result).toEqual(mockUser);
      });
    });

    describe('User Not Found Errors', () => {
      it('should throw error if user not found', async () => {
        // Mock the database to return an error
        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { message: 'User not found' }
              }))
            }))
          }))
        });
        
        // Expected error
        await expect(AuthService.getUserByEmail('nonexistent@example.com')).rejects.toThrow('User not found');
      });

      it('should throw error when database returns error', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { message: 'Database error' }
              }))
            }))
          }))
        });

        await expect(
          AuthService.getUserByEmail('test@example.com')
        ).rejects.toThrow('User not found');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty email in registerUser', async () => {
      const error = new Error('Invalid email');
      error.code = 'auth/invalid-email';
      auth.createUser.mockRejectedValue(error);

      await expect(
        AuthService.registerUser('', 'password123')
      ).rejects.toThrow('Registration failed');
    });

    it('should handle empty password in registerUser', async () => {
      const error = new Error('Weak password');
      error.code = 'auth/weak-password';
      auth.createUser.mockRejectedValue(error);

      await expect(
        AuthService.registerUser('test@example.com', '')
      ).rejects.toThrow('Registration failed');
    });

    it('should handle null values in getUserByEmail', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'User not found' }
            }))
          }))
        }))
      });

      await expect(
        AuthService.getUserByEmail(null)
      ).rejects.toThrow('User not found');
    });

    it('should handle undefined values in getUserByUid', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'User not found' }
            }))
          }))
        }))
      });

      await expect(
        AuthService.getUserByUid(undefined)
      ).rejects.toThrow('User not found');
    });

    it('should handle database errors without code property', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            data: null,
            error: { 
              message: 'Some other error without code'
            }
          }))
        }))
      });

      await expect(
        AuthService.registerUser('test@example.com', 'password123')
      ).rejects.toThrow('Registration failed');
    });
  });
});
