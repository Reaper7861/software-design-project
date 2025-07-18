// Setup

// Force environment loading
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
// Import Supertest to simulate HTTP requests
const request = require("supertest");
// Import Express app
const app = require("../src/app");
const admin = require("firebase-admin");
// REST API for ID tokens
const axios = require("axios");
// mock FCM tokens
const { fcmTokens } = require('../src/utils/fcmTokenStore');
// MockData for helper functions
const { getUser, updateUser } = require('../src/data/mockData');
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

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: newEmail,  
        password: testPassword
      });

    // Expected status code
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      user: {
        success: true,
        user: {
          uid: expect.any(String),
          email: newEmail.toLowerCase(),
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
  let authServiceMock;
  let req, res;

  beforeEach(() => {
    jest.resetModules();
    authServiceMock = {
      getUserByUid: jest.fn(),
    };
    jest.doMock('../src/services/authService', () => authServiceMock);
    AuthController = require('../src/controllers/authController');
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // Test: getCurrentUser should return user info if found
  it('should return user info if found', async () => {
    req.user = { uid: 'fakeUid' };
    authServiceMock.getUserByUid.mockResolvedValue({
      uid: 'fakeUid',
      email: 'fakeUid@example.com',
      role: 'admin',
      profile: { profileCompleted: true }
    });
    await AuthController.getCurrentUser(req, res);
    // Expected call
    expect(authServiceMock.getUserByUid).toHaveBeenCalledWith('fakeUid');
    expect(res.json).toHaveBeenCalledWith({
      user: {
        uid: 'fakeUid',
        email: 'fakeUid@example.com',
        role: 'admin',
        profileCompleted: true
      }
    });
  });

  // Test: getCurrentUser should handle user not found error
  it('should handle user not found error', async () => {
    req.user = { uid: 'u2' };
    authServiceMock.getUserByUid.mockRejectedValue(new Error('not found'));
    await AuthController.getCurrentUser(req, res);
    // Expected status code and error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User not found',
      message: 'not found'
    });
  });
});


// UserRoute Unit testing -------------------------------------------------------------------------------------------------------------------------------------------

describe('profileRoutes', () => {
  beforeAll(() => {
    jest.resetModules();
  });

  // Mock data and middleware modules inside the describe block for isolation
  jest.mock('../src/data/mockData', () => ({
    getUser: jest.fn(),
    updateUser: jest.fn(),
    createUser: jest.fn(),
  }));
  jest.mock('../src/middleware/auth', () => ({
    verifyToken: (req, res, next) => {
      req.user = req.user || { uid: 'test-uid' };
      next();
    },
  }));

  // Re-import after mocking
  const { getUser, updateUser, createUser } = require('../src/data/mockData');
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
    const userProfile = { name: 'John Doe', email: 'john@example.com' };
    getUser.mockReturnValue({ profile: userProfile });

    await new Promise(resolve => {
      const req = { user: { uid: 'test-uid' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
          expect(getUser).toHaveBeenCalledWith('test-uid');
          expect(res.json).toHaveBeenCalledWith({
            message: 'Token verified successfully',
            profile: userProfile
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
    getUser.mockReturnValue(null);

    await new Promise(resolve => {
      const req = { user: { uid: 'missing-uid' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
          expect(getUser).toHaveBeenCalledWith('missing-uid');
          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
          resolve();
          return res;
        }),
      };
      router.handle({ ...req, method: 'GET', url: '/profile' }, res, resolve);
    });
  });

  // Test case: POST /update-profile should return the updated user profile
  test('POST /update-profile - returns updated profile', async () => {
    // Make sure updateUser returns a user object
    updateUser.mockReturnValue({ profile: { name: 'Updated Name' } });

    await new Promise(resolve => {
      const req = {
        user: { uid: 'test-uid' },
        body: { name: 'Updated Name' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
          expect(updateUser).toHaveBeenCalledWith('test-uid', { name: 'Updated Name' });
          expect(res.json).toHaveBeenCalledWith({ name: 'Updated Name' });
          resolve();
          return res;
        }),
      };
      router.handle({ ...req, method: 'POST', url: '/update-profile' }, res, resolve);
    });
  });

  // Test case: POST /update-profile returns 404 if the user doesn't exist
  test('POST /update-profile - returns 404 if user not found', async () => {
    updateUser.mockReturnValue(null);

    await new Promise(resolve => {
      const req = {
        user: { uid: 'invalid-uid' },
        body: { name: 'No One' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
          expect(updateUser).toHaveBeenCalledWith('invalid-uid', { name: 'No One' });
          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
          resolve();
          return res;
        }),
      };
      router.handle({ ...req, method: 'POST', url: '/update-profile' }, res, resolve);
    });
  });

  // Test case: POST /create-profile should return a success message
  test('POST /create-profile - returns creation message', async () => {
    getUser.mockReturnValue(null); // Simulate user does not exist
    createUser.mockReturnValue({ profile: { name: 'New Profile' } });

    await new Promise(resolve => {
      const req = {
        user: { uid: 'test-uid' },
        body: { name: 'New Profile' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
          expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Profile' }));
          resolve();
          return res;
        }),
      };
      router.handle({ ...req, method: 'POST', url: '/create-profile' }, res, resolve);
    });
  });

  test('GET /profile - returns token verification message and user profile', async () => {
    const userProfile = { name: 'John Doe', email: 'john@example.com' };
    getUser.mockReturnValue({ profile: userProfile });

    await new Promise(resolve => {
      const req = { user: { uid: 'test-uid' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
          expect(getUser).toHaveBeenCalledWith('test-uid');
          expect(res.json).toHaveBeenCalledWith({ message: 'Token verified successfully', profile: userProfile });
          resolve();
          return res;
        }),
      };
      router.handle({ ...req, method: 'GET', url: '/profile' }, res, resolve);
    });
  });
});


// ** Testing Notifications here ** //

//Saves FCM successfully
describe("Notification Routes", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
    // and clear the tokens
    for (const key in fcmTokens) {
      delete fcmTokens[key];
    }
  });

  it("should save FCM token successfully", async () => {
    const res = await request(app)
      .post("/api/notifications/save-fcm-token")
      .set("Authorization", `Bearer ${idToken}`)
      .send({
        token: "dummy_fcm_token_for_test"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
    });
  });

  //does not save fcm 
  it("should fail saving FCM token without token", async () => {
    const res = await request(app)
      .post("/api/notifications/save-fcm-token")
      .set("Authorization", `Bearer ${idToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  //UID is missing
  it("should fail sending notification if uid is missing", async () => {
    const res = await request(app)
      .post("/api/notifications/send")
      .set("Authorization", `Bearer ${idToken}`) 
      .send({ title: "Test", body: "Test message" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  // Send Notification: fail with missing fields
  it("should return 400 if recipient uid, title, or body is missing", async () => {
  // Missing toUid
  let res = await request(app)
    .post("/api/notifications/send")
    .set("Authorization", `Bearer ${idToken}`) 
    .send({ title: "Hello", body: "World" });

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error");

  // Missing title
  res = await request(app)
    .post("/api/notifications/send")
    .set("Authorization", `Bearer ${idToken}`) 
    .send({ uid: "someUid", body: "Body text" });

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error");

  // Missing body
  res = await request(app)
    .post("/api/notifications/send")
    .set("Authorization", `Bearer ${idToken}`) 
    .send({ uid: "someUid", title: "Title" });

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error");
});

  // Get Volunteers List: success
  it("should retrieve volunteers list", async () => {
    const res = await request(app)
      .get("/api/notifications/volunteers")
      .set("Authorization", `Bearer ${adminIdToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("uid");
    expect(res.body[0]).toHaveProperty("email");
  });

  //volunteer list fails
  it("should return 500 if listing users fails", async () => {
  const listUsersMock = jest.spyOn(admin.auth(), "listUsers").mockImplementation(() => {
    throw new Error("Mock listUsers failure");
  });

  const res = await request(app)
    .get("/api/notifications/volunteers")
    .set("Authorization", `Bearer ${adminIdToken}`);

  expect(res.statusCode).toBe(500);
  expect(res.body).toHaveProperty("error", "Failed to fetch users");

  listUsersMock.mockRestore();
});

  //missing FCM token for uid given
  it("should return 404 if no FCM token is found for given uid", async () => {
  const res = await request(app)
    .post("/api/notifications/send")
    .set("Authorization", `Bearer ${idToken}`) 
    .send({
      toUid: "nonexistent_uid",
      title: "Test",
      body: "Test body"
    });

  expect(res.statusCode).toBe(404);
  expect(res.body).toHaveProperty("error");
});


////this whole block is just admin messaging //////
const admin = require("firebase-admin");

// Mock admin.messaging().send for these tests
jest.spyOn(admin.messaging(), "send");

it("should send notification successfully", async () => {
  // Mock the send method to resolve successfully
  admin.messaging().send.mockResolvedValue("mockMessageId123");

  const toUid = "testRecipientUid";

  // Add the recipient FCM token in your in-memory store 

  fcmTokens[toUid] = "dummy_token";

  const res = await request(app)
    .post("/api/notifications/send")
    .set("Authorization", `Bearer ${idToken}`) 
    .send({
      toUid,
      title: "Hello",
      body: "Test message",
    });

  const decoded = await admin.auth().verifyIdToken(idToken);

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.response).toBe("mockMessageId123");
  expect(res.body.fromUid).toBe(decoded.uid);  // Compare against the real UID from the token
  expect(res.body.toUid).toBe(toUid);
});

/// failed notification send
it("should return 500 if sending notification fails", async () => {
  // Mock the send method to reject with an error
  admin.messaging().send.mockRejectedValue(new Error("Firebase send error"));

  const toUid = "testRecipientUid2";

  fcmTokens[toUid] = "dummy_token";

  const res = await request(app)
    .post("/api/notifications/send")
    .set("Authorization", `Bearer ${idToken}`)
    .send({
      toUid,
      title: "Hello",
      body: "Test message",
    });

  expect(res.statusCode).toBe(500);
  expect(res.body).toHaveProperty("error", "Firebase send error");
});
///end block ///

});

// ** Volunteer History Testing here  ** //

describe("Volunteer History Route", () => {
  it("should return volunteer history data", async () => {
    const res = await request(app).get("/api/volunteer-history");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Check structure of the first object
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        volunteer: expect.any(String),
        eventName: expect.any(String),
        description: expect.any(String),
        location: expect.any(String),
        requiredSkills: expect.any(String),
        urgency: expect.any(String),
        date: expect.any(String),
        participationStatus: expect.any(String),
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
      const createEventRes = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({
          eventName: "Matching Event",
          eventDate: "2025-08-06",
          location: "Austin, TX",
          requiredSkills: ["Teamwork"],
          urgency: "Medium",
        });

      expect(createEventRes.statusCode).toBe(201);
      expect(createEventRes.body).toHaveProperty("success", true);
      expect(createEventRes.body.event).toHaveProperty("eventId");

      const eventId = createEventRes.body.event.eventId;

      //  Use hardcoded volunteer "test2@gmail.com" 
      const userId = (await auth.getUserByEmail("test2@gmail.com")).uid;

      const res = await request(app)
        .post("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({ userId: userId, eventId: eventId });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.match).toMatchObject({
        userId: userId, 
        eventId: eventId,
      });
    });

    it("should retrieve all matches", async () => {
      const createEventRes = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({
          eventName: "Match Event",
          eventDate: "2025-08-07",
          location: "Houston, TX",
          requiredSkills: ["Communication"],
          urgency: "High",
        });

      expect(createEventRes.statusCode).toBe(201);
      expect(createEventRes.body).toHaveProperty("success", true);
      expect(createEventRes.body.event).toHaveProperty("eventId");

      const eventId = createEventRes.body.event.eventId;

      // Use hardcoded volunteer "test2@gmail.com" instead of dynamic volunteerEmail
      const userId = (await auth.getUserByEmail("test2@gmail.com")).uid;

      const matchRes = await request(app)
        .post("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({ userId: userId, eventId: eventId }); 

      expect(matchRes.statusCode).toBe(201);

      const res = await request(app)
        .get("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(Array.isArray(res.body.matches)).toBe(true);
      expect(res.body.matches.length).toBeGreaterThan(0);
    });

    //----------------------------retrieving events work with ID------------------------------------

  it("should retrieve a single event by ID", async () => {
      // Create an event and get its ID
      const createRes = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({
          eventName: "Single Event",
          eventDate: "2025-08-03",
          location: "Dallas, TX",
          requiredSkills: ["Teamwork"],
          urgency: "Low",
        });

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body).toHaveProperty("success", true);
      expect(createRes.body.event).toHaveProperty("eventId");

      const eventId = createRes.body.event.eventId;

      // Send GET request to fetch the specific event
      const res = await request(app)
        .get(`/api/events/${eventId}`)
        .set("Authorization", `Bearer ${adminIdToken}`);

      // Check if retrieval was successful (200 OK)
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.event).toMatchObject({
        eventId: eventId,
        eventName: "Single Event",
      }); // Verify the event matches the created one
    });
    //----------------------------------------------------------------



    it("should unmatch a volunteer from an event", async () => {
      const createEventRes = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({
          eventName: "Unmatch Event",
          eventDate: "2025-08-09",
          location: "San Antonio, TX",
          requiredSkills: ["Leadership"],
          urgency: "Medium",
        });

      expect(createEventRes.statusCode).toBe(201);
      expect(createEventRes.body).toHaveProperty("success", true);
      expect(createEventRes.body.event).toHaveProperty("eventId");

      const eventId = createEventRes.body.event.eventId;

      //  Use hardcoded volunteer "test2@gmail.com" 

      const userId = (await auth.getUserByEmail("test2@gmail.com")).uid;

      const matchRes = await request(app)
        .post("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({ userId: userId, eventId: eventId });

      expect(matchRes.statusCode).toBe(201);

      const res = await request(app)
        .delete("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({ userId: userId, eventId: eventId }); 

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message", "Volunteer unmatched from event");
    });

    it("should return 400 for invalid user or event ID", async () => {
      const res = await request(app)
        .post("/api/matching")
        .set("Authorization", `Bearer ${adminIdToken}`)
        .send({ userId: "invalid_user", eventId: "invalid_event" });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Invalid user or event ID");
    });
  });

// ** Event Management Testing here  ** //

//Event Update Test ---------------------------------------------


  describe("Event Management Routes", () => {
  it("should update an existing event", async () => {
    // Create an event
    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${adminIdToken}`)
      .send({
        eventName: "Original Event",
        eventDate: "2025-08-10",
        location: "Austin, TX",
        requiredSkills: ["Teamwork"],
        urgency: "Low",
      });
    expect(createRes.statusCode).toBe(201);
    const eventId = createRes.body.event.eventId;

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
      eventId,
      eventName: "Updated Event",
      location: "Houston, TX",
    });

    // Verify the update
    const getRes = await request(app)
      .get(`/api/events/${eventId}`)
      .set("Authorization", `Bearer ${adminIdToken}`);
    expect(getRes.body.event.eventName).toBe("Updated Event");
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
  const eventId = createRes.body.event.eventId;

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
  // Create multiple events
  await request(app)
    .post("/api/events")
    .set("Authorization", `Bearer ${adminIdToken}`)
    .send({
      eventName: "Event 1",
      eventDate: "2025-08-12",
      location: "Austin, TX",
      requiredSkills: ["Teamwork"],
      urgency: "High",
    });
  await request(app)
    .post("/api/events")
    .set("Authorization", `Bearer ${adminIdToken}`)
    .send({
      eventName: "Event 2",
      eventDate: "2025-08-13",
      location: "San Antonio, TX",
      requiredSkills: ["Communication"],
      urgency: "Low",
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
  const createRes = await request(app)
    .post("/api/events")
    .set("Authorization", `Bearer ${adminIdToken}`)
    .send({
      eventName: "Multi-Volunteer Event",
      eventDate: "2025-08-14",
      location: "Austin, TX",
      requiredSkills: ["Teamwork"],
      urgency: "Medium",
    });
  const eventId = createRes.body.event.eventId;

  const userId1 = (await auth.getUserByEmail("test2@gmail.com")).uid;
  const userId2 = (await auth.getUserByEmail("test3@gmail.com")).uid; // Assume another test user

  await request(app)
    .post("/api/matching")
    .set("Authorization", `Bearer ${adminIdToken}`)
    .send({ userId: userId1, eventId });
  await request(app)
    .post("/api/matching")
    .set("Authorization", `Bearer ${adminIdToken}`)
    .send({ userId: userId2, eventId });

  const res = await request(app)
    .get("/api/matching")
    .set("Authorization", `Bearer ${adminIdToken}`);
  expect(res.body.matches.length).toBeGreaterThanOrEqual(2);
});

it("should return empty matches for an event with no volunteers", async () => {
  const createRes = await request(app)
    .post("/api/events")
    .set("Authorization", `Bearer ${adminIdToken}`)
    .send({
      eventName: "Empty Event",
      eventDate: "2025-08-15",
      location: "Houston, TX",
      requiredSkills: ["Leadership"],
      urgency: "Low",
    });
  const eventId = createRes.body.event.eventId;

  const res = await request(app)
    .get("/api/matching")
    .set("Authorization", `Bearer ${adminIdToken}`);
  expect(res.body.matches.filter(m => m.eventId === eventId).length).toBe(0);
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
  let req, res, next, mockUsers;

  beforeEach(() => {
    req = { user: { uid: 'test-uid' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    mockUsers = new Map();
    jest.resetModules();
    jest.doMock('../src/data/mockData', () => ({users: mockUsers}));
  });

  // Test: User not found
  it('should return 404 if user not found', () => {
    const { requireAdmin } = require('../src/middleware/role');
    requireAdmin(req, res, next);
    // Expected status code and error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({error: 'User not found'});
    expect(next).not.toHaveBeenCalled();
  });

  // Test: User not admin
  it('should return 403 if user is not admin', () => {
    mockUsers.set('test-uid', { role: 'volunteer' });
    const { requireAdmin } = require('../src/middleware/role');
    requireAdmin(req, res, next);
    // Expected status code and error
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({error: 'Access denied - administrators only.'});
    expect(next).not.toHaveBeenCalled();
  });

  // Test: User is admin
  it('should call next if user is admin', () => {
    mockUsers.set('test-uid', { role: 'administrator' });
    const { requireAdmin } = require('../src/middleware/role');
    requireAdmin(req, res, next);
    // Expected call
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

