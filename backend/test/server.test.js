// Setup

// Import Supertest to simulate HTTP requests
const request = require("supertest");
// Import Express app
const app = require("../src/app");

// Mock Firebase Auth, no real Firebase calls are made
jest.mock('../src/config/firebase', () => ({
  auth: {
    // Fake createUser
    createUser: jest.fn().mockResolvedValue({
      uid: 'fake-uid',
      email: 'test@example.com',
      password: 'Test123!'
    })
  }
}));


// Testing

// Group Auth API
describe("API Endpoints", () => {
  // Test: registering a new user
  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "testing@example.com",  
        password: "Test123!"
      });

    // Expected status code
    expect(res.statusCode).toBe(201);
    // Expected success message
    expect(res.body).toHaveProperty("message", "User registered successfully");
    // Expected body has object with uid and email
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("uid");
    expect(res.body.user).toHaveProperty("email");
  });

  // Test: Registering with missing email
  it("should fail registration with missing email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        password: "Test123!"
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
        password: "Test123!"
      });

    // Expected status code and error 
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  // // Test: Login with correct credentials
  // it("should login successfully with correct credential", async () => {
  //   const res = await request(app)
  //     .post("/api/auth/login")
  //     .send({
  //       email: "test@example.com",
  //       password: "Test123!"
  //     });

  //   // Expected status code and token
  //   expect(res.statusCode).toBe(200);
  //   expect(res.body).toHaveProperty("token");
  // });
});
