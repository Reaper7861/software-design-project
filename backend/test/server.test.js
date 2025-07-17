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
    .set("Authorization", `Bearer ${idToken}`) // simulate auth with your test user token
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
    availability: ["2025-08-08"] // adjust based on your format
  };

  const res = await request(app)
    .put(`/api/users/${userId}`)
    .set("Authorization", `Bearer ${adminIdToken}`)
    .send(profileData);

  console.log("Profile update response:", res.body); // log for debugging
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
      .send({ userId: userId, eventId: eventId }); // updated to use userId

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.match).toMatchObject({
      userId: userId, // updated to use userId
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
      .send({ userId: userId, eventId: eventId }); // Updated to use userId

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

    //  Use hardcoded volunteer "test2@gmail.com" instead of dynamic volunteerEmail

    const userId = (await auth.getUserByEmail("test2@gmail.com")).uid;

    const matchRes = await request(app)
      .post("/api/matching")
      .set("Authorization", `Bearer ${adminIdToken}`)
      .send({ userId: userId, eventId: eventId }); // Updated to use userId

    expect(matchRes.statusCode).toBe(201);

    const res = await request(app)
      .delete("/api/matching")
      .set("Authorization", `Bearer ${adminIdToken}`)
      .send({ userId: userId, eventId: eventId }); // Updated to use userId

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