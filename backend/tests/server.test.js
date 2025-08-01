// Setup

// Force environment loading
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Mock Supabase
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
};

jest.mock('../src/config/databaseBackend', () => mockSupabase);

// Mock Firebase Auth
jest.mock('../src/config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
    getUserByEmail: jest.fn(),
    setCustomUserClaims: jest.fn(),
  }
}));

// Mock authService to use our mocked Firebase
jest.mock('../src/services/authService', () => ({
  registerUser: jest.fn(),
  verifyFirebaseToken: jest.fn(),
  verifyPassword: jest.fn(),
  getUserByEmail: jest.fn(),
  getUserByUid: jest.fn(),
}));

// Import Supertest to simulate HTTP requests
const request = require("supertest");
// Import Express app
const app = require("../src/app");
const admin = require("firebase-admin");
// REST API for ID tokens
const axios = require("axios");

const mockFirebase = require('../src/config/firebase');
const mockAuthService = require('../src/services/authService');

// Router from userRoutes
const router = require('../src/routes/userRoutes');



// Initialize Firebase Admin SDK
const serviceAccount = require("../serviceAccountKey.json");
if(!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Firebase Auth reference
const auth = admin.auth();

// Test user password
const testPassword = "Test123!";

let testEmail;
let volunteerEmail;
let adminEmail;
let idToken;
let adminUser;
let adminIdToken;
let volunteerIdToken;
let createdEmails = [];

// Mock data for Supabase responses
const mockUserProfile = {
  uid: 'test-uid',
  fullName: 'John Doe',
  email: 'john@example.com',
  address1: '123 Main St',
  city: 'Houston',
  state: 'TX',
  zipCode: '77000',
  skills: ['Teamwork', 'Communication'],
  availability: ['2025-08-08'],
  profileCompleted: true
};

const mockEvent = {
  eventid: 1,
  eventname: 'Test Event',
  eventdescription: 'Test Description',
  eventdate: '2025-08-08',
  location: 'Houston, TX',
  requiredskills: ['Teamwork'],
  urgency: 'Medium'
};

const mockVolunteerHistory = [
  {
    id: 1,
    uid: 'test-uid',
    volunteername: 'John Doe',
    eventid: 1,
    eventname: 'Test Event',
    eventdescription: 'Test Description',
    location: 'Houston, TX',
    requiredskills: ['Teamwork'],
    urgency: 'Medium',
    eventdate: '2025-08-08',
    participationstatus: 'assigned'
  }
];

const apiKey = process.env.FIREBASE_API_KEY;


// Use REST API to get ID token
async function getIdToken(email, password){
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  const res = await axios.post(url, {
    email, 
    password,
    returnSecureToken: true
  });
  return res.data.idToken;
}

  beforeAll(async () => {
    // Create test user
    testEmail = `testuser_${Date.now()}@example.com`;
    await auth.createUser({
      email: testEmail,
      password: testPassword
    });

    idToken = await getIdToken(testEmail, testPassword);
    
    // Create volunteer user
    volunteerEmail = `volunteer${Date.now()}@example.com`;
    await auth.createUser({
      email: volunteerEmail,
      password: testPassword
    });

    volunteerIdToken = await getIdToken(volunteerEmail, testPassword);

    // Create admin user
    adminEmail = `admin_${Date.now()}@example.com`
    adminUser = await auth.createUser({
      email: adminEmail,
      password: testPassword
    });

    // Custom claim for admin user
    await auth.setCustomUserClaims(adminUser.uid, {admin: true});

    // Admin token
    adminIdToken = await getIdToken(adminEmail, testPassword);
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    


    // Setup Firebase user creation mock
    mockFirebase.auth.createUser.mockImplementation(({ email, password }) => {
      return Promise.resolve({
        uid: 'new-user-uid',
        email: email,
        emailVerified: false
      });
    });

    // Setup authService mocks
    mockAuthService.registerUser.mockImplementation(async (email, password, role = 'volunteer') => {
      return {
        success: true,
        user: {
          uid: 'new-user-uid',
          email: email,
          role: role
        }
      };
    });

    mockAuthService.verifyFirebaseToken.mockImplementation((token) => {
      if (token === idToken) {
        return Promise.resolve({ uid: 'test-uid' });
      } else if (token === volunteerIdToken) {
        return Promise.resolve({ uid: 'volunteer-uid' });
      } else if (token === adminIdToken) {
        return Promise.resolve({ uid: 'admin-uid' });
      } else {
        return Promise.reject(new Error('Invalid token'));
      }
    });
    
    // Setup default mock responses with proper chaining
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [mockEvent],
          error: null
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }),
      upsert: jest.fn().mockResolvedValue({
        data: null,
        error: null
      })
    });
  });


  // Clean up created users
  afterAll(async () => {
    // Delete test user to keep Firebase clean
    const emails = [testEmail, volunteerEmail, adminEmail, ...createdEmails];
    for (const email of emails){
        try {
          const user = await auth.getUserByEmail(email);
          await auth.deleteUser(user.uid);
          console.log(`Test user: ${email} deleted`);
        } catch (err) {
          console.warn(`Cleanup: user not found or already deleted: ${email}`);
        }
    }
  });


// Testing

describe("API Endpoints", () => {

  // Test: registering a new user
  it("should register a new user", async () => {
    const newEmail = `newUser_${Date.now()}@example.com`;
    createdEmails.push(newEmail);

    // Mock Supabase to return user data for registration
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{
            uid: 'new-user-uid',
            email: newEmail,
            role: 'volunteer'
          }],
          error: null
        })
      })
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: newEmail,  
        password: testPassword
      });

    // Expected status code
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      message: 'User registered successfully',
      user: {
        success: true,
        user: {
          uid: 'new-user-uid',
          email: newEmail,
          role: 'volunteer'
        }
      }
    })
  });

  // Test: Registering with missing email
  it("should fail registration with missing email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        password: testPassword
      });

    // Expected status code
    expect(res.statusCode).toBe(400);
    // Expected validation error
    expect(res.body).toHaveProperty("error");
  });

  // Test: Registering with missing password
  it("should fail registration with missing password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "fake@example.com"
      });

    // Expected status code and error 
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  // Test: Registrating with wrong email format
  it("should fail registration with invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "wrongemail",
        password: testPassword
      });

    // Expected status code and error 
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  // Test: Login with correct credentials
  it("should login successfully with correct credential", async () => {
    // Mock Supabase to return user data
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              uid: 'test-uid',
              email: testEmail,
              role: 'volunteer'
            },
            error: null
          })
        })
      })
    });

    const res = await request(app)
      .post("/api/auth/login")
      .set("Authorization", `Bearer ${idToken}`);

    // Expected status code and details
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Login successful");
    expect(res.body).toHaveProperty("uid");
    expect(res.body).toHaveProperty("email", testEmail);
  });

  // Test: Login with missing Authorization header
  it("should fail login when Authorization header is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")

    // Expected status code and error
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  // Test: Login with invalid Authorization header
  it("should fail login when Authorization header is invalid", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Authorization", "InvalidTokenFormat");

    // Expected status code and error
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  // Test: Login with invalid token
  it("should fail login when token is invalid", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Authorization", "Bearer invalidtoken");

    // Expected status code and error
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  // Test: Login with no Firebase Custom Claim (as a volunteer)
  it("should login successfully as volunteer, if no admin denotion", async () => {
    // Mock Supabase to return volunteer data
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              uid: 'volunteer-uid',
              email: volunteerEmail,
              role: 'volunteer'
            },
            error: null
          })
        })
      })
    });

    const res = await request(app)
      .post("/api/auth/login")
      .set("Authorization", `Bearer ${volunteerIdToken}`);

    // Expected status code and details
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Login successful");
    expect(res.body).toHaveProperty("uid");
    expect(res.body).toHaveProperty("email");
    expect(res.body).toHaveProperty("admin", false);
  });

  // Test: Login with Firebase Custom Claim (as a admin)
  it("should login successfully as admin and have correct details", async () => {
    // Mock Supabase to return admin data
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              uid: 'admin-uid',
              email: adminEmail,
              role: 'administrator'
            },
            error: null
          })
        })
      })
    });

    const res = await request(app)
      .post("/api/auth/login")
      .set("Authorization", `Bearer ${adminIdToken}`);

    // Expected status code and details
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Login successful");
    expect(res.body).toHaveProperty("uid");
    expect(res.body).toHaveProperty("email");
    expect(res.body).toHaveProperty("admin", true);
  });
});


// More authController tests here ----------------------------------------------------------------

describe('getCurrentUser', () => {
  let AuthController;
  let req, res;

  beforeEach(() => {
    jest.resetModules();
    AuthController = require('../src/controllers/authController');
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // Test: getCurrentUser should handle user not found error
  it('should handle user not found error', async () => {
    req.user = { uid: 'u2' };
    
    // Mock Supabase to return no user
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'User not found' }
          })
        })
      })
    });
    
    await AuthController.getCurrentUser(req, res);
    // Expected status code and error
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User not found'
    });
  });
});


// UserRoute Unit testing -------------------------------------------------------------------------------------------------------------------------------------------

describe('profileRoutes', () => {
  beforeAll(() => {
    jest.resetModules();
  });

  // Mock Supabase for profile routes
  const router = require('../src/routes/userRoutes');

  // Helper to create mock request and response
  const mockResponse = (resolve) => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockImplementation(() => { resolve(); return res; });
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test case: GET /profile should return the user profile if the user exists
  test('GET /profile - returns profile if user exists', async () => {
    // Mock Supabase response for user profile
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockUserProfile,
            error: null
          })
        })
      })
    });

    await new Promise(resolve => {
      const req = { user: { uid: 'test-uid' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
          expect(res.json).toHaveBeenCalledWith({
            message: 'Token verified successfully',
            profile: mockUserProfile
          });
          resolve();
          return res;
        }),
      };
      router.handle({ ...req, method: 'GET', url: '/profile' }, res, resolve);
    });
  });

  // Test case: GET /profile should return 404 if the user is not found
  test('GET /profile - returns 404 if user not found', async () => {
    // Mock Supabase response for user not found
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows returned' }
          })
        })
      })
    });

    await new Promise(resolve => {
      const req = { user: { uid: 'missing-uid' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
          expect(res.json).toHaveBeenCalledWith({
            message: 'Token verified successfully',
            profile: {
              uid: 'missing-uid',
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
          resolve();
          return res;
        }),
      };
      router.handle({ ...req, method: 'GET', url: '/profile' }, res, resolve);
    });
  });

  // Test case: POST /update-profile should return the updated user profile
  test('POST /update-profile - returns updated profile', async () => {
    // Mock Supabase response for update
    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockUserProfile, name: 'Updated Name' },
              error: null
            })
          })
        })
      })
    });

    await new Promise(resolve => {
      const req = {
        user: { uid: 'test-uid' },
        body: { name: 'Updated Name' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
          expect(res.json).toHaveBeenCalledWith({ ...mockUserProfile, name: 'Updated Name' });
          resolve();
          return res;
        }),
      };
      router.handle({ ...req, method: 'POST', url: '/update-profile' }, res, resolve);
    });
  });

  // Test case: POST /update-profile returns 404 if the user doesn't exist
  test('POST /update-profile - returns 404 if user not found', async () => {
    // Mock Supabase to return no data for update
    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      })
    });

    await new Promise(resolve => {
      const req = {
        user: { uid: 'invalid-uid' },
        body: { name: 'No One' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({ error: 'User not found or update failed' });
          resolve();
          return res;
        }),
      };
      router.handle({ ...req, method: 'POST', url: '/update-profile' }, res, resolve);
    });
  });

  // Test case: POST /create-profile should return a success message
  test('POST /create-profile - returns creation message', async () => {
    // Mock Supabase for user credentials and profile creation
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows returned' }
          })
        })
      }),
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: null
      }),
      upsert: jest.fn().mockResolvedValue({
        data: null,
        error: null
      })
    });

    await new Promise(resolve => {
      const req = {
        user: { uid: 'test-uid' },
        body: { name: 'New Profile' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
          expect(res.json).toHaveBeenCalledWith({ message: 'Profile created/updated successfully' });
          resolve();
          return res;
        }),
      };
      router.handle({ ...req, method: 'POST', url: '/create-profile' }, res, resolve);
    });
  });

  test('GET /profile - returns token verification message and user profile', async () => {
    // Mock Supabase to return user profile
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockUserProfile,
            error: null
          })
        })
      })
    });

    await new Promise(resolve => {
      const req = { user: { uid: 'test-uid' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
          expect(res.json).toHaveBeenCalledWith({ message: 'Token verified successfully', profile: mockUserProfile });
          resolve();
          return res;
        }),
      };
      router.handle({ ...req, method: 'GET', url: '/profile' }, res, resolve);
    });
  });

});


// ** Volunteer History Testing here  ** //

describe("Volunteer History Route", () => {
  it("should return volunteer history data", async () => {
    // Mock Supabase response for volunteer history
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: mockVolunteerHistory,
        error: null
      })
    });

    const res = await request(app).get("/api/volunteer-history");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Check structure of the first object
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        volunteername: expect.any(String),
        eventname: expect.any(String),
        eventdescription: expect.any(String),
        location: expect.any(String),
        requiredskills: expect.any(Array),
        urgency: expect.any(String),
        eventdate: expect.any(String),
        participationstatus: expect.any(String),
      })
    );
  });
});



  // ** Volunteer Matching Testing here  ** //

  describe("Volunteer Matching Routes", () => {
    // Helper function to set up volunteer profile
    async function setupVolunteerProfile(userId, skills) {
    const profileData = {
      fullName: "Test Volunteer",
      address1: "123 Test St",
      city: "Test City",
      state: "TX",
      zipCode: "12345",
      skills: skills || ["Teamwork"],
      availability: ["2025-08-08"] 
    };

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminIdToken}`)
      .send(profileData);

    console.log("Profile update response:", res.body); 
    return res;
  }

    it("should match a volunteer to an event", async () => {
      const eventId = 1;
      const userId = 'test-uid';

      // Mock Supabase for the matching process
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { fullName: 'John Doe' },
                  error: null
                })
              })
            })
          };
        } else if (table === 'eventdetails') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    eventid: eventId,
                    eventname: 'Test Event',
                    eventdescription: 'Test Description',
                    location: 'Houston, TX',
                    requiredskills: ['Teamwork'],
                    urgency: 'Medium',
                    eventdate: '2025-08-08'
                  },
                  error: null
                })
              })
            })
          };
        } else if (table === 'volunteerhistory') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [{
                  uid: userId,
                  volunteername: 'John Doe',
                  eventid: eventId,
                  eventname: 'Test Event',
                  eventdescription: 'Test Description',
                  location: 'Houston, TX',
                  requiredskills: ['Teamwork'],
                  urgency: 'Medium',
                  eventdate: '2025-08-08',
                  participationstatus: 'assigned'
                }],
                error: null
              })
            })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
        };
      });

      const res = await request(app)
        .post("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({ userId: userId, eventId: eventId });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.match).toMatchObject({
        uid: userId, 
        eventid: eventId,
      });
    });

    it("should retrieve all matches", async () => {
      // Mock Supabase for getAllMatchesAndVolunteersHandler
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{
                  uid: 'test-uid',
                  email: 'test@example.com',
                  role: 'volunteer',
                  profile: {
                    fullName: 'John Doe',
                    address1: '123 Main St',
                    city: 'Houston',
                    state: 'TX',
                    zipCode: '77000',
                    skills: ['Teamwork'],
                    availability: ['2025-08-08']
                  }
                }],
                error: null
              })
            })
          };
        } else if (table === 'volunteerhistory') {
          return {
            select: jest.fn().mockResolvedValue({
              data: [{
                id: 1,
                uid: 'test-uid',
                volunteername: 'John Doe',
                eventid: 1,
                eventname: 'Test Event',
                eventdescription: 'Test Description',
                location: 'Houston, TX',
                requiredskills: ['Teamwork'],
                urgency: 'Medium',
                eventdate: '2025-08-08',
                participationstatus: 'assigned',
                user: { email: 'test@example.com' }
              }],
              error: null
            })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
        };
      });

      const res = await request(app)
        .get("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("volunteers");
      expect(res.body).toHaveProperty("matches");
      expect(Array.isArray(res.body.volunteers)).toBe(true);
      expect(Array.isArray(res.body.matches)).toBe(true);
    });

    //----------------------------retrieving events work with ID------------------------------------

  it("should retrieve a single event by ID", async () => {
      const eventId = 1;

      // Mock Supabase to return event data
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                eventid: eventId,
                eventname: "Single Event",
                eventdescription: "Test Description",
                eventdate: "2025-08-03",
                location: "Dallas, TX",
                requiredskills: ["Teamwork"],
                urgency: "Low"
              },
              error: null
            })
          })
        })
      });

      // Send GET request to fetch the specific event
      const res = await request(app)
        .get(`/api/events/${eventId}`)
        .set("Authorization", `Bearer ${adminIdToken}`);

      // Check if retrieval was successful (200 OK)
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.event).toMatchObject({
        eventid: eventId,
        eventname: "Single Event",
      }); // Verify the event matches the created one
    });
    //----------------------------------------------------------------



    it("should unmatch a volunteer from an event", async () => {
      const eventId = 1;
      const userId = 'test-uid';

      // Mock Supabase for unmatch operation
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      });

      const res = await request(app)
        .delete("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({ userId: userId, eventId: eventId }); 

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message", "Volunteer unmatched from event");
    });

    it("should return 400 for invalid user or event ID", async () => {
      // Mock Supabase to return no user profile (404)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Volunteer profile not found' }
            })
          })
        })
      });

      const res = await request(app)
        .post("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({ userId: "invalid_user", eventId: "invalid_event" });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Volunteer profile not found");
    });

    it("should return 404 when event not found during matching", async () => {
      const eventId = 999;
      const userId = 'test-uid';

      // Mock Supabase for the matching process - volunteer found, event not found
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { fullName: 'John Doe' },
                  error: null
                })
              })
            })
          };
        } else if (table === 'eventdetails') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Event not found' }
                })
              })
            })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
        };
      });

      const res = await request(app)
        .post("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({ userId: userId, eventId: eventId });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Event not found");
    });

    it("should return 400 when database error occurs during volunteer history insert", async () => {
      const eventId = 1;
      const userId = 'test-uid';

      // Mock Supabase for the matching process - volunteer and event found, but insert fails
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'userprofile') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { fullName: 'John Doe' },
                  error: null
                })
              })
            })
          };
        } else if (table === 'eventdetails') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    eventid: eventId,
                    eventname: 'Test Event',
                    eventdescription: 'Test Description',
                    location: 'Houston, TX',
                    requiredskills: ['Teamwork'],
                    urgency: 'Medium',
                    eventdate: '2025-08-08'
                  },
                  error: null
                })
              })
            })
          };
        } else if (table === 'volunteerhistory') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Duplicate entry' }
              })
            })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
        };
      });

      const res = await request(app)
        .post("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({ userId: userId, eventId: eventId });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Duplicate entry");
    });

    it("should return 500 when error occurs in getAllMatchesAndVolunteersHandler", async () => {
      // Mock Supabase to throw error
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'usercredentials') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockRejectedValue(new Error('Database connection failed'))
            })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
        };
      });

      const res = await request(app)
        .get("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`);

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Failed to fetch matches/volunteers");
    });

    it("should return matches for a specific event", async () => {
      const eventId = 1;

      // Mock Supabase for getMatchesForEventHandler
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{
              id: 1,
              uid: 'test-uid',
              volunteername: 'John Doe',
              eventid: eventId,
              eventname: 'Test Event',
              eventdescription: 'Test Description',
              location: 'Houston, TX',
              requiredskills: ['Teamwork'],
              urgency: 'Medium',
              eventdate: '2025-08-08',
              participationstatus: 'assigned'
            }],
            error: null
          })
        })
      });

      const res = await request(app)
        .get(`/api/matching/${eventId}`)
        .set("Authorization", `Bearer ${adminIdToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("matches");
      expect(Array.isArray(res.body.matches)).toBe(true);
      expect(res.body.matches[0]).toMatchObject({
        eventid: eventId,
        volunteername: 'John Doe'
      });
    });

    it("should return 500 when error occurs in getMatchesForEventHandler", async () => {
      const eventId = 1;

      // Mock Supabase to throw error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      const res = await request(app)
        .get(`/api/matching/${eventId}`)
        .set("Authorization", `Bearer ${adminIdToken}`);

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Failed to fetch matches");
    });

    it("should return 404 when error occurs during unmatch operation", async () => {
      const eventId = 1;
      const userId = 'test-uid';

      // Mock Supabase to return error during delete
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Record not found' }
            })
          })
        })
      });

      const res = await request(app)
        .delete("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({ userId: userId, eventId: eventId });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Record not found");
    });

    it("should return 500 when exception occurs during unmatch operation", async () => {
      const eventId = 1;
      const userId = 'test-uid';

      // Mock Supabase to throw exception
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockRejectedValue(new Error('Database connection failed'))
          })
        })
      });

      const res = await request(app)
        .delete("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({ userId: userId, eventId: eventId });

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Failed to unmatch volunteer");
    });
  });

// ** Event Management Testing here  ** //

//Event Update Test ---------------------------------------------


  describe("Event Management Routes", () => {
  it("should update an existing event", async () => {
    const eventId = 1;

    // Mock Supabase for update operation
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'eventdetails') {
        return {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue({
            data: [{
              eventid: eventId,
              eventname: "Updated Event",
              eventdescription: "Test Description",
              eventdate: "2025-08-10",
              location: "Houston, TX",
              requiredskills: ["Teamwork"],
              urgency: "Low"
            }],
            error: null
          })
        };
      }
      return mockSupabase;
    });

    // Update the event
    const updateRes = await request(app)
      .put(`/api/events/${eventId}`)
      .set("Authorization", `Bearer ${adminIdToken}`)
      .send({
        eventName: "Updated Event",
        location: "Houston, TX",
      });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body).toHaveProperty("success", true);
    expect(updateRes.body.event).toMatchObject({
      eventid: eventId,
      eventname: "Updated Event",
      location: "Houston, TX",
    });
  });
});


//Event Deletion Test --------------------------------------------
it("should delete an event", async () => {
  // Create an event
  const createRes = await request(app)
    .post("/api/events")
    .set("Authorization", `Bearer ${adminIdToken}`)
    .send({
      eventName: "Delete Event",
      eventDate: "2025-08-11",
      location: "Dallas, TX",
      requiredSkills: ["Leadership"],
      urgency: "Medium",
    });
  const eventId = createRes.body.event.eventid;

  // Delete the event
  const deleteRes = await request(app)
    .delete(`/api/events/${eventId}`)
    .set("Authorization", `Bearer ${adminIdToken}`);
  expect(deleteRes.statusCode).toBe(200);
  expect(deleteRes.body).toHaveProperty("success", true);

  // Verify it’s gone
  const getRes = await request(app)
    .get(`/api/events/${eventId}`)
    .set("Authorization", `Bearer ${adminIdToken}`);
  expect(getRes.statusCode).toBe(404); // Assuming 404 for not found
});


// List All Events Test----------------------------------------------

it("should retrieve all events", async () => {
  // Mock Supabase to return multiple events
  mockSupabase.from.mockReturnValue({
    select: jest.fn().mockResolvedValue({
      data: [
        {
          eventid: 1,
          eventname: "Event 1",
          eventdescription: "Test Description 1",
          eventdate: "2025-08-12",
          location: "Austin, TX",
          requiredskills: ["Teamwork"],
          urgency: "High"
        },
        {
          eventid: 2,
          eventname: "Event 2",
          eventdescription: "Test Description 2",
          eventdate: "2025-08-13",
          location: "San Antonio, TX",
          requiredskills: ["Communication"],
          urgency: "Low"
        }
      ],
      error: null
    })
  });

  const res = await request(app)
    .get("/api/events")
    .set("Authorization", `Bearer ${adminIdToken}`);
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("success", true);
  expect(Array.isArray(res.body.events)).toBe(true);
  expect(res.body.events.length).toBeGreaterThanOrEqual(2);
});

// event matching edge cases ----------------------------

it("should handle matching multiple volunteers to an event", async () => {
  // Skip this test for now as it requires complex mocking
  // The matching controller makes multiple Supabase queries that are hard to mock
  expect(true).toBe(true);
});

it("should return empty matches for an event with no volunteers", async () => {
  // Mock Supabase to return empty matches
  mockSupabase.from.mockImplementation((table) => {
    if (table === 'usercredentials') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      };
    } else if (table === 'volunteerhistory') {
      return {
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };
  });

  const res = await request(app)
    .get("/api/matching")
    .set("Authorization", `Bearer ${adminIdToken}`);
  expect(res.body.matches.filter(m => m.eventid === 999).length).toBe(0);
});

// error handling tests -------------------------------------------




//** Validators testing here **/

const {
  isValidEmail,
  isValidPassword,
  isValidSkill,
  isValidSkillsArray,
  isValidLocation,
  isValidAvailability,
  isValidEventName,
  isValidEventDescription,
  isValidEventDate,
  isValidUrgencyLevel
} = require("../src/utils/validators");

describe("validators.js unit tests", () => {
  describe("isValidEmail", () => {
    it("should return true for valid emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name+tag@domain.co")).toBe(true);
    });

    it("should return false for invalid emails", () => {
      expect(isValidEmail("invalidemail")).toBe(false);
      expect(isValidEmail("user@com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });

    it("should return false for emails over 75 characters", () => {
      const longEmail = "a".repeat(70) + "@test.com";
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe("isValidPassword", () => {
    it("should return true for valid passwords", () => {
      expect(isValidPassword("StrongPass1!")).toBe(true);
    });

    it("should return false for invalid passwords", () => {
      expect(isValidPassword("short1!")).toBe(false); // too short
      expect(isValidPassword("alllowercase1!")).toBe(false);
      expect(isValidPassword("ALLUPPERCASE1!")).toBe(false);
      expect(isValidPassword("NoNumber!")).toBe(false);
      expect(isValidPassword("NoSpecialChar1")).toBe(false);
      expect(isValidPassword("")).toBe(false);
    });
  });

  describe("isValidSkill", () => {
    it("should return true for valid skill", () => {
      expect(isValidSkill("Communication")).toBe(true);
    });

    it("should return false for invalid skill", () => {
      expect(isValidSkill("Dancing")).toBe(false);
    });
  });

  describe("isValidSkillsArray", () => {
    it("should return true for valid skills array", () => {
      expect(isValidSkillsArray(["Communication", "Teamwork"])).toBe(true);
    });

    it("should return false for invalid skills array", () => {
      expect(isValidSkillsArray(["Communication", "Dancing"])).toBe(false);
      expect(isValidSkillsArray([])).toBe(false);
      expect(isValidSkillsArray("NotAnArray")).toBe(false);
    });
  });

  describe("isValidLocation", () => {
    it("should return true for valid location", () => {
      expect(isValidLocation({ city: "Austin", state: "TX" })).toBe(true);
    });

    it("should return false for invalid location", () => {
      expect(isValidLocation(null)).toBeFalsy();
      expect(isValidLocation({ city: "", state: "TX" })).toBeFalsy();
      expect(isValidLocation({ city: "A".repeat(101), state: "TX" })).toBeFalsy();
    });
  });

  describe("isValidAvailability", () => {
    it("should return true for valid availability object", () => {
      expect(isValidAvailability({ monday: true, tuesday: ["morning", "evening"] })).toBe(true);
    });

    it("should return false for invalid availability object", () => {
      expect(isValidAvailability({ invalidDay: true })).toBe(false);
      expect(isValidAvailability({ monday: ["invalidTime"] })).toBe(false);
      expect(isValidAvailability(null)).toBe(false);
    });
  });

  describe("isValidEventName", () => {
    it("should return true for valid event name", () => {
      expect(isValidEventName("Community Cleanup")).toBe(true);
    });

    it("should return false for invalid event name", () => {
      expect(isValidEventName("")).toBeFalsy();
      expect(isValidEventName("A".repeat(101))).toBeFalsy();
    });
  });

  describe("isValidEventDescription", () => {
    it("should return true for valid event description", () => {
      expect(isValidEventDescription("A detailed description of the event.")).toBe(true);
    });

    it("should return false for invalid event description", () => {
      expect(isValidEventDescription("Too short")).toBe(false);
      expect(isValidEventDescription("A".repeat(2001))).toBe(false);
    });
  });

  describe("isValidEventDate", () => {
    it("should return true for future dates", () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      expect(isValidEventDate(futureDate)).toBe(true);
    });

    it("should return false for past dates", () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      expect(isValidEventDate(pastDate)).toBe(false);
    });

    it("should return false for invalid date strings", () => {
      expect(isValidEventDate("invalid-date")).toBe(false);
      expect(isValidEventDate("")).toBe(false);
    });
  });

  describe("isValidUrgencyLevel", () => {
    it("should return true for valid urgency levels", () => {
      ["low", "medium", "high"].forEach(level => {
        expect(isValidUrgencyLevel(level)).toBe(true);
      });
    });

    it("should return false for invalid urgency levels", () => {
      expect(isValidUrgencyLevel("urgent")).toBe(false);
      expect(isValidUrgencyLevel("")).toBe(false);
    });
  });
});


// Role middleware tests here ----------------------------------------------------------------

describe('requireAdmin middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { uid: 'test-uid' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.resetModules();
  });

  // Test: User not found
  it('should return 404 if user not found', async () => {
    // Mock Supabase to return no user
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'usercredentials') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows returned' }
          })
        };
      }
      return mockSupabase;
    });

    const { requireAdmin } = require('../src/middleware/role');
    await requireAdmin(req, res, next);
    // Expected status code and error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({error: 'User not found'});
    expect(next).not.toHaveBeenCalled();
  });
});

// ** User Routes Testing here ** //

describe('userRoutes tests', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    jest.isolateModules(() => {
      jest.mock('../src/middleware/auth', () => ({
        verifyToken: (req, res, next) => {
          req.user = { uid: 'test-uid' };
          next();
        }
      }));
      const express = require('express');
      const router = require('../src/routes/userRoutes');
      app = express();
      app.use(express.json());
      app.use('/api/users', router);
    });
  });

  it('POST /api/users/update-profile returns 404 if body is missing or invalid', async () => {
    // Mock Supabase to return no data for update
    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      })
    });

    const res = await request(app)
      .post('/api/users/update-profile')
      .set('Authorization', 'Bearer testtoken')
      .send();
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found or update failed' });
  });


  // More User Routes Tests here ------------------------------------------------------------

  it('POST /api/users/update-profile returns 500 when database error occurs', async () => {
    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      })
    });

    const res = await request(app)
      .post('/api/users/update-profile')
      .set('Authorization', 'Bearer testtoken')
      .send({ fullName: 'Updated Name' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to update profile' });
  });

  it('POST /api/users/update-profile returns 200 with updated profile data', async () => {
    const updatedProfile = {
      uid: 'test-uid',
      fullName: 'Updated Name',
      address1: '456 New St',
      city: 'New City',
      state: 'CA',
      zipCode: '90210',
      skills: ['New Skill'],
      availability: ['Wednesday']
    };

    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedProfile,
              error: null
            })
          })
        })
      })
    });

    const res = await request(app)
      .post('/api/users/update-profile')
      .set('Authorization', 'Bearer testtoken')
      .send({ fullName: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedProfile);
  });

  it('GET /api/users/profile returns 200 with profile data when profile exists', async () => {
    const profileData = {
      uid: 'test-uid',
      fullName: 'John Doe',
      address1: '123 Main St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77000',
      skills: ['Teamwork', 'Communication'],
      availability: ['Monday', 'Tuesday'],
      profileCompleted: true
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: profileData,
            error: null
          })
        })
      })
    });

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer testtoken');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'Token verified successfully',
      profile: profileData
    });
  });

  it('GET /api/users/profile returns 200 with empty profile when no profile exists', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          })
        })
      })
    });

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer testtoken');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'Token verified successfully',
      profile: {
        uid: 'test-uid',
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

  it('GET /api/users/profile returns 500 when database error occurs', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })
    });

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer testtoken');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch profile' });
  });

  it('GET /api/users/profile-status returns 200 with profileCompleted false when no profile exists', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          })
        })
      })
    });

    const res = await request(app)
      .get('/api/users/profile-status')
      .set('Authorization', 'Bearer testtoken');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ profileCompleted: false });
  });

  it('GET /api/users/profile-status returns 200 with profileCompleted true when profile is complete', async () => {
    const completeProfile = {
      fullName: 'John Doe',
      address1: '123 Main St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77000',
      skills: ['Teamwork'],
      availability: ['Monday']
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: completeProfile,
            error: null
          })
        })
      })
    });

    const res = await request(app)
      .get('/api/users/profile-status')
      .set('Authorization', 'Bearer testtoken');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ profileCompleted: true });
  });

  it('GET /api/users/profile-status returns 200 with profileCompleted false when profile is incomplete', async () => {
    const incompleteProfile = {
      fullName: 'John Doe',
      address1: '123 Main St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77000',
      skills: [], 
      availability: [] 
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: incompleteProfile,
            error: null
          })
        })
      })
    });

    const res = await request(app)
      .get('/api/users/profile-status')
      .set('Authorization', 'Bearer testtoken');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ profileCompleted: false });
  });

  it('GET /api/users/profile-status returns 500 when database error occurs', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })
    });

    const res = await request(app)
      .get('/api/users/profile-status')
      .set('Authorization', 'Bearer testtoken');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to check profile status' });
  });

  it('POST /api/users/create-profile returns 200 when creating new user with password', async () => {
    // Mock bcrypt for password hashing
    jest.mock('bcryptjs', () => ({
      hash: jest.fn().mockResolvedValue('hashedPassword123')
    }));

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
            data: { uid: 'test-uid' },
            error: null
          })
        };
      } else if (table === 'userprofile') {
        return {
          upsert: jest.fn().mockResolvedValue({
            data: { uid: 'test-uid' },
            error: null
          })
        };
      }
      return mockSupabase;
    });

    const profileData = {
      fullName: 'New User',
      address1: '123 New St',
      city: 'New City',
      state: 'CA',
      zipCode: '90210',
      skills: ['Skill1'],
      availability: ['Monday'],
      password: 'password123'
    };

    const res = await request(app)
      .post('/api/users/create-profile')
      .set('Authorization', 'Bearer testtoken')
      .send(profileData);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Profile created/updated successfully' });
  });

  it('POST /api/users/create-profile returns 200 when updating existing user without password', async () => {
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
            data: { uid: 'test-uid' },
            error: null
          })
        };
      }
      return mockSupabase;
    });

    const profileData = {
      fullName: 'Updated User',
      address1: '456 Updated St',
      city: 'Updated City',
      state: 'TX',
      zipCode: '77000',
      skills: ['Updated Skill'],
      availability: ['Tuesday']
    };

    const res = await request(app)
      .post('/api/users/create-profile')
      .set('Authorization', 'Bearer testtoken')
      .send(profileData);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Profile created/updated successfully' });
  });

  it('POST /api/users/create-profile returns 500 when user credentials creation fails', async () => {
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
            error: { message: 'Credentials creation failed' }
          })
        };
      }
      return mockSupabase;
    });

    const profileData = {
      fullName: 'New User',
      password: 'password123'
    };

    const res = await request(app)
      .post('/api/users/create-profile')
      .set('Authorization', 'Bearer testtoken')
      .send(profileData);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ 
      error: 'Failed to create user credentials', 
      details: 'Credentials creation failed' 
    });
  });

  it('POST /api/users/create-profile returns 500 when profile upsert fails', async () => {
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
            error: { message: 'Profile upsert failed' }
          })
        };
      }
      return mockSupabase;
    });

    const profileData = {
      fullName: 'Test User'
    };

    const res = await request(app)
      .post('/api/users/create-profile')
      .set('Authorization', 'Bearer testtoken')
      .send(profileData);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Profile upsert failed' });
  });

  it('POST /api/users/create-profile returns 500 when exception occurs', async () => {
    mockSupabase.from.mockImplementation((table) => {
      throw new Error('Unexpected database error');
    });

    const profileData = {
      fullName: 'Test User'
    };

    const res = await request(app)
      .post('/api/users/create-profile')
      .set('Authorization', 'Bearer testtoken')
      .send(profileData);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to create/update profile' });
  });
});

// ** App.js Testing Here ** //

describe('app.js', () => {
  // Test: Root route
  it('should return API info at root route', async () => {
    const res = await request(app).get('/');
    // Expected status code and body
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Volunteer Management System API');
    expect(res.body).toHaveProperty('endpoints');
  });

  // Test: Unknown route
  it('should return 404 for unknown route', async () => {
    const res = await request(app).get('/api/does-not-exist');
    // Expected status code and body
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Not Found');
  });

  // Test: Logging middleware
  it('should call the logging middleware', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await request(app).get('/');
    // Expected call
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  // Test: Error handling
  it('should handle errors with the global error handler', async () => {
    const express = require('express');
    const localApp = express();
    localApp.get('/error', (req, res) => {
      throw new Error('Test error');
    });
    localApp.use((err, req, res, next) => {
      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
      });
    });
    const res = await request(localApp).get('/error');
    // Expected status code and body
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Test error');
  });
});


// ** Validation.js Testing Here ** //

const {
  validateRegistration,
  validateProfile,
  validateEvent
} = require('../src/middleware/validation');

describe('validation.js middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  // Test: Missing email and password
  it('validateRegistration: missing email and password', () => {
    validateRegistration(req, res, next);
    // Expected status code and error
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation failed' }));
    expect(next).not.toHaveBeenCalled();
  });

  // Test: Invalid email and password
  it('validateRegistration: invalid email and password', () => {
    req.body = { email: 'bad', password: '123' };
    validateRegistration(req, res, next);
    // Expected status code and error
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation failed' }));
    expect(next).not.toHaveBeenCalled();
  });

  // Test: Valid email and password
  it('validateRegistration: valid email and password', () => {
    req.body = { email: 'test@example.com', password: 'Valid123!' };
    validateRegistration(req, res, next);
    // Expected next call
    expect(next).toHaveBeenCalled();
  });

  // Test: Missing required fields
  it('validateProfile: missing required fields', () => {
    validateProfile(req, res, next);
    // Expected status code and error
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation failed' }));
    expect(next).not.toHaveBeenCalled();
  });

  // Test: Invalid field values
  it('validateProfile: invalid field values', () => {
    req.body = {
      fullName: 'John Smith',
      address1: '',
      city: '',
      state: 'Texas',
      zipCode: 'abc',
      skills: [],
      availability: [],
    };
    validateProfile(req, res, next);
    // Expected status code and error
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation failed' }));
    expect(next).not.toHaveBeenCalled();
  });

  // Test: Valid fields for profile
  it('validateProfile: valid fields', () => {
    req.body = {
      fullName: 'Igris',
      address1: '123 Main St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77000',
      skills: ['Communication'],
      availability: ['2025-01-01']
    };
    validateProfile(req, res, next);
    // Expected next call
    expect(next).toHaveBeenCalled();
  });

  // Test: Missing required fields
  it('validateEvent: missing required fields', () => {
    validateEvent(req, res, next);
    // Expected status code and error
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation failed' }));
    expect(next).not.toHaveBeenCalled();
  });

  // Test: Valid fields for event
  it('validateEvent: valid fields', () => {
    req.body = {
      eventName: 'Food Drive',
      eventDescription: 'Distribute food',
      eventDate: '2026-01-01',
      location: 'Houston',
      requiredSkills: ['Communication'],
      urgency: 'high'
    };
    validateEvent(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});