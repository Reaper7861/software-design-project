// Setup

// Import Supertest to simulate HTTP requests
const request = require("supertest");
// Import Express app
const app = require("../src/app");
const admin = require("firebase-admin");
// REST API for ID tokens
const axios = require("axios");


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


const apiKey = "AIzaSyBc63gB-VcvAkF9E3jnD_C6IINP2S_MBhU";


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

    console.log("REGISTER RESPONSE:", JSON.stringify(res.body, null, 2));

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
    // Expected success message
    //expect(res.body).toHaveProperty("message", "User registered successfully");
    // Expected body has object with uid and email
    // expect(res.body).toHaveProperty("user");
    // expect(res.body.user).toHaveProperty("uid");
    // expect(res.body.user).toHaveProperty("email", newEmail);
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
