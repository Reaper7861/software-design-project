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




// UserRoute Unit testing -------------------------------------------------------------------------------------------------------------------------------------------

jest.mock('../src/data/mockData', () => ({
  getUser: jest.fn(),
  updateUser: jest.fn(),
}));

// Mock verifyToken middleware to inject a fake user
jest.mock('../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { uid: 'test-uid' };
    next();
  },
}));

// Helper to create mock request and response
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Begin test suite for the profile-related Express routes
describe('profileRoutes', () => {
  
  // Reset mock function call history before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test case: GET /profile should return the user profile if the user exists
  test('GET /profile - returns profile if user exists', async () => {
    // Mock user profile returned by getUser
    const userProfile = { name: 'John Doe', email: 'john@example.com' };
    getUser.mockReturnValue({ profile: userProfile });

    // Simulate Express request and response objects
    const req = { user: { uid: 'test-uid' } };
    const res = mockResponse();

    // Manually invoke router handler for the /profile GET request
    await new Promise(resolve =>
      router.handle({ ...req, method: 'GET', url: '/profile' }, res, resolve)
    );

    // Assert getUser was called with the correct user ID
    expect(getUser).toHaveBeenCalledWith('test-uid');

    // Assert the response includes the correct user profile
    expect(res.json).toHaveBeenCalledWith(userProfile);
  });

  // Test case: GET /profile should return 404 if the user is not found
  test('GET /profile - returns 404 if user not found', async () => {
    // Simulate getUser returning null (user not found)
    getUser.mockReturnValue(null);

    const req = { user: { uid: 'missing-uid' } };
    const res = mockResponse();

    // Call the route handler
    await new Promise(resolve =>
      router.handle({ ...req, method: 'GET', url: '/profile' }, res, resolve)
    );

    // Assert proper error handling
    expect(getUser).toHaveBeenCalledWith('missing-uid');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  // Test case: POST /update-profile should return the updated user profile
  test('POST /update-profile - returns updated profile', async () => {
    // Define what updateUser should return
    const updatedProfile = { name: 'Updated Name', email: 'john@example.com' };
    updateUser.mockReturnValue({ profile: updatedProfile });

    const req = {
      user: { uid: 'test-uid' },
      body: { name: 'Updated Name' }, // update payload
    };
    const res = mockResponse();

    // Call the route handler
    await new Promise(resolve =>
      router.handle({ ...req, method: 'POST', url: '/update-profile' }, res, resolve)
    );

    // Assert that the update was processed correctly
    expect(updateUser).toHaveBeenCalledWith('test-uid', { name: 'Updated Name' });
    expect(res.json).toHaveBeenCalledWith(updatedProfile);
  });

  // Test case: POST /update-profile returns 404 if the user doesn't exist
  test('POST /update-profile - returns 404 if user not found', async () => {
    // Simulate user not found scenario
    updateUser.mockReturnValue(null);

    const req = {
      user: { uid: 'invalid-uid' },
      body: { name: 'No One' },
    };
    const res = mockResponse();

    // Call the route handler
    await new Promise(resolve =>
      router.handle({ ...req, method: 'POST', url: '/update-profile' }, res, resolve)
    );

    // Assert correct error response
    expect(updateUser).toHaveBeenCalledWith('invalid-uid', { name: 'No One' });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  // Test case: POST /create-profile should return a success message
  test('POST /create-profile - returns creation message', async () => {
    const req = {
      user: { uid: 'test-uid' },
      body: { name: 'New Profile' },
    };
    const res = mockResponse();

    // Call the route handler
    await new Promise(resolve =>
      router.handle({ ...req, method: 'POST', url: '/create-profile' }, res, resolve)
    );

    // Assert success response
    expect(res.json).toHaveBeenCalledWith('You created!');
  });

  test('GET /profile - returns token verification message and user profile', async () => {
    const userProfile = { name: 'John Doe', email: 'john@example.com' };
  
    // Mock getUser to return user with profile
    getUser.mockReturnValue({ profile: userProfile });
  
    const req = { user: { uid: 'test-uid' } };
    const res = mockResponse();
  
    // Call route handler manually
    await new Promise(resolve =>
      router.handle({ ...req, method: 'GET', url: '/profile' }, res, resolve)
    );
  
    expect(getUser).toHaveBeenCalledWith('test-uid');
  
    // Expect response to include both token message and profile
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token verified successfully',
      profile: userProfile
    });
  });
  


});

