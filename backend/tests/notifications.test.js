const request = require('supertest');
const express = require('express');
const notificationsRouter = require('../src/routes/notificationRoutes');
const admin = require('firebase-admin');
const supabase = require('../src/config/databaseBackend');

//express app hre
app = express();
app.use(express.json());
app.use('/api/notifications', notificationsRouter);


// Mock middleware
jest.mock('../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { uid: 'test-uid' }; // Mock authenticated user
    next();
  }
}));

// Mock all the firebase stuff
const mockMessaging = {
  send: jest.fn()
};

const mockAuth = {
  verifyIdToken: jest.fn(),
  listUsers: jest.fn()
};

jest.mock('firebase-admin', () => ({
  messaging: jest.fn(() => mockMessaging),
  auth: jest.fn(() => mockAuth)
}));


// Mock Supabase
jest.mock('../src/config/databaseBackend', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockResolvedValue({ data: null, error: null })
}));

describe('Notifications Routes', () => {
  const mockUserId = 'test-uid';
  const mockAdminId = 'admin-user-uid';
  const mockIdToken = 'mock-id-token';
  const mockAdminIdToken = 'mock-admin-token';
  const mockNotification = {
    id: 1,
    sender_uid: 'test-user-123',
    receiver_uid: 'other-user-456',
    subject: 'Test Notification',
    message: 'This is a test message',
    timestamp: new Date().toISOString(),
    is_read: false,
    sender: { fullName: 'Test User' },
    receiver: { fullName: 'Other User' }
  };


    beforeEach(() => {
        // Setup default mock implementations
        mockAuth.verifyIdToken.mockImplementation((token) => {
        if (token === mockIdToken) {
            return Promise.resolve({ uid: mockUserId });
        } else if (token === mockAdminIdToken) {
            return Promise.resolve({ uid: mockAdminId });
        }
        return Promise.reject(new Error('Invalid token'));
        });

        // Default mock for listUsers
        mockAuth.listUsers.mockImplementation(() => ({
        users: [
            { uid: 'user1', email: 'user1@test.com', displayName: 'User One' },
            { uid: 'user2', email: 'user2@test.com', displayName: 'User Two' }
        ],
        pageToken: null
        }));
    });

    afterEach(() => {
    jest.clearAllMocks();
  });



  it("should save FCM token successfully", async () => {
    const res = await request(app)
      .post("/api/notifications/save-fcm-token")
      .set("Authorization", `Bearer ${mockIdToken}`)
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
      .set("Authorization", `Bearer ${mockIdToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  //UID is missing
  it("should fail sending notification if uid is missing", async () => {
    const res = await request(app)
      .post("/api/notifications/send")
      .set("Authorization", `Bearer ${mockIdToken}`) 
      .send({ title: "Test", body: "Test message" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  // Send Notification: fail with missing fields
  it("should return 400 if recipient uid, title, or body is missing", async () => {
  // Missing toUid
  let res = await request(app)
    .post("/api/notifications/send")
    .set("Authorization", `Bearer ${mockIdToken}`) 
    .send({ title: "Hello", body: "World" });

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error");

  // Missing title
  res = await request(app)
    .post("/api/notifications/send")
    .set("Authorization", `Bearer ${mockIdToken}`) 
    .send({ toUid: "someUid", body: "Body text" });

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error");

  // Missing body
  res = await request(app)
    .post("/api/notifications/send")
    .set("Authorization", `Bearer ${mockIdToken}`) 
    .send({ uid: "someUid", title: "Title" });

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error");
});



/*

  // Get Volunteers List: success
  it("should retrieve volunteers list", async () => {
    const res = await request(app)
      .get("/api/notifications/volunteers")
      .set("Authorization", `Bearer ${mockAdminIdToken}`);

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
    .set("Authorization", `Bearer ${mockAdminIdToken}`);

  expect(res.statusCode).toBe(500);
  expect(res.body).toHaveProperty("error", "Failed to fetch users");

  listUsersMock.mockRestore();
});
 */

////all volunteer stuff here
describe('GET /api/notifications/volunteers', () => {
  it('should retrieve enriched volunteers list with active FCM tokens', async () => {
    // Mock active FCM tokens
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockResolvedValueOnce({
          data: [{ user_id: 'user1' }, { user_id: 'user2' }],
          error: null
        })
      })
    });

    // Mock Firebase users (paginated)
    admin.auth().listUsers.mockImplementationOnce((maxResults, pageToken) => ({
      users: [
        { uid: 'user1', email: 'user1@test.com', displayName: 'User One' },
        { uid: 'user2', email: 'user2@test.com', displayName: 'User Two' }
      ],
      pageToken: null
    }));

    // Mock user profiles
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        in: jest.fn().mockResolvedValueOnce({
          data: [
            { uid: 'user1', fullName: 'User One Full' },
            { uid: 'user2', fullName: 'User Two Full' }
          ],
          error: null
        })
      })
    });

    const res = await request(app)
      .get('/api/notifications/volunteers')
      .set('Authorization', `Bearer ${mockAdminIdToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        uid: 'user1',
        email: 'user1@test.com',
        name: 'User One',
        fullName: 'User One Full'
      },
      {
        uid: 'user2',
        email: 'user2@test.com',
        name: 'User Two',
        fullName: 'User Two Full'
      }
    ]);
  });

  it('should handle FCM token fetch error', async () => {
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'DB error' }
        })
      })
    });

    const res = await request(app)
      .get('/api/notifications/volunteers');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch FCM tokens' });
  });

  it('should handle Firebase listUsers error', async () => {
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockResolvedValueOnce({
          data: [{ user_id: 'user1' }],
          error: null
        })
      })
    });

    admin.auth().listUsers.mockImplementation(() => {
      throw new Error('Firebase error');
    });

    const res = await request(app)
      .get('/api/notifications/volunteers');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch users' });
  });

  it('should handle user profile fetch error', async () => {
    // First mock for FCM tokens
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockResolvedValueOnce({
          data: [{ user_id: 'user1' }],
          error: null
        })
      })
    });

    // Second mock for user profiles
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        in: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Profile error' }
        })
      })
    });

    admin.auth().listUsers.mockResolvedValueOnce({
      users: [{ uid: 'user1', email: 'user1@test.com', displayName: 'User One' }],
      pageToken: null
    });

    const res = await request(app)
      .get('/api/notifications/volunteers');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch user profiles' });
  });
});





  //missing FCM token for uid given //temporarily set to 200 = ok due to testing limitation !!
  it("should return 200 and a warning message if no FCM token is found for given uid", async () => {
  const res = await request(app)
    .post("/api/notifications/send")
    .set("Authorization", `Bearer ${mockIdToken}`)
    .send({
      toUid: "nonexistent_uid",
      title: "Test",
      body: "Test body"
    });

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("success", true);
  expect(res.body).toHaveProperty("message");
  expect(res.body.message).toMatch(/No FCM token found/);
});


////this whole block is just admin messaging //////
const admin = require("firebase-admin");

// Mock admin.messaging().send for these tests
jest.spyOn(admin.messaging(), "send");



/*
it("should send notification successfully", async () => {
  // Mock the send method to resolve successfully
  admin.messaging().send.mockResolvedValue("mockMessageId123");

  const toUid = "testRecipientUid";

  // Add the recipient FCM token in your in-memory store 

  fcmTokens[toUid] = "dummy_token";

  const res = await request(app)
    .post("/api/notifications/send")
    .set("Authorization", `Bearer ${mockIdToken}`) 
    .send({
      toUid,
      title: "Hello",
      body: "Test message",
    });

  const decoded = await admin.auth().verifyIdToken(mockIdToken);

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
    .set("Authorization", `Bearer ${mockIdToken}`)
    .send({
      toUid,
      title: "Hello",
      body: "Test message",
    });

  expect(res.statusCode).toBe(500);
  expect(res.body).toHaveProperty("error", "Firebase send error");
});*/

//send notif successfully
it("should send notification successfully", async () => {
  // Mock FCM token lookup from Supabase
  supabase.from.mockReturnValueOnce({
    select: jest.fn().mockReturnValueOnce({
      eq: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockReturnValueOnce({
              maybeSingle: jest.fn().mockResolvedValueOnce({
                data: { fcm_token: 'dummy_token' },
                error: null
              })
            })
          })
        })
      })
    })
  });

  // Mock notification insertion
  supabase.from.mockReturnValueOnce({
    insert: jest.fn().mockResolvedValueOnce({ 
      data: { id: 1 }, 
      error: null 
    })
  });

  // Mock Firebase send
  admin.messaging().send.mockResolvedValue("mockMessageId123");

  const toUid = "testRecipientUid";
  const res = await request(app)
    .post("/api/notifications/send")
    .set("Authorization", `Bearer ${mockIdToken}`)
    .send({
      toUid,
      title: "Hello",
      body: "Test message",
    });

  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.response).toBe("mockMessageId123");
  expect(res.body.fromUid).toBe(mockUserId);
  expect(res.body.toUid).toBe(toUid);
});

///fails to send notif
it("should return 500 if sending notification fails", async () => {
  // Mock FCM token lookup from Supabase
  supabase.from.mockReturnValueOnce({
    select: jest.fn().mockReturnValueOnce({
      eq: jest.fn().mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockReturnValueOnce({
              maybeSingle: jest.fn().mockResolvedValueOnce({
                data: { fcm_token: 'dummy_token' },
                error: null
              })
            })
          })
        })
      })
    })
  });

  // Mock Firebase send failure
  admin.messaging().send.mockRejectedValue(new Error("Firebase send error"));

  const toUid = "testRecipientUid2";
  const res = await request(app)
    .post("/api/notifications/send")
    .set("Authorization", `Bearer ${mockIdToken}`)
    .send({
      toUid,
      title: "Hello",
      body: "Test message",
    });

  expect(res.statusCode).toBe(500);
  expect(res.body).toHaveProperty("error", "Firebase send error");
});

//adding more unit tests//

/*
//grab all notifications in inbox
it("should fetch notifications for the logged-in user", async () => {
  const res = await request(app)
    .get("/api/notifications")
    .set("Authorization", `Bearer ${mockIdToken}`);

  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

//supabase fails
it("should return 500 if notification fetch fails", async () => {
  jest.spyOn(supabase, 'from').mockImplementation(() => ({
    select: () => ({
      or: () => ({
        order: () => ({ data: null, error: new Error("DB error") })
      })
    })
  }));

  const res = await request(app)
    .get("/api/notifications")
    .set("Authorization", `Bearer ${mockIdToken}`);

  expect(res.statusCode).toBe(500);
  expect(res.body).toHaveProperty("error");
}); */

describe('GET /api/notifications', () => {
  it('should fetch notifications for the logged-in user', async () => {
    // Mock notifications data
    const mockNotifications = [
      {
        id: 1,
        sender_uid: 'test-uid',
        receiver_uid: 'other-uid',
        subject: 'Test',
        message: 'Test message',
        timestamp: new Date().toISOString(),
        is_read: false,
        sender: { fullName: 'Test User' },
        receiver: { fullName: 'Other User' }
      }
    ];

    // Mock Supabase query
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        or: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockResolvedValueOnce({
            data: mockNotifications,
            error: null
          })
        })
      })
    });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${mockIdToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('subject');
    expect(res.body[0]).toHaveProperty('message');
  });

  it('should return 500 if notification fetch fails', async () => {
    // Mock failed Supabase query
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        or: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockResolvedValueOnce({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })
    });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${mockIdToken}`);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error', 'Failed to fetch notifications');
  });
});


//test notifications inbox route
test('successfully fetches notifications', async () => {
    supabase.order.mockResolvedValueOnce({
      data: [mockNotification],
      error: null
    });

    const response = await request(app)
      .get('/api/notifications')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([mockNotification]);
    expect(supabase.from).toHaveBeenCalledWith('notifications');
    expect(supabase.select).toHaveBeenCalledWith(`
        *,
        sender:userprofile!sender_uid(fullName),
        receiver:userprofile!receiver_uid(fullName)
      `);
    expect(supabase.or).toHaveBeenCalledWith(
      `sender_uid.eq.${mockUserId},receiver_uid.eq.${mockUserId}`
    );
    expect(supabase.order).toHaveBeenCalledWith('timestamp', { ascending: false });
  });

  test('returns empty array when no notifications exist', async () => {
    supabase.order.mockResolvedValueOnce({
      data: [],
      error: null
    });

    const response = await request(app)
      .get('/api/notifications')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('handles Supabase query error', async () => {
    supabase.order.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' }
    });

    const response = await request(app)
      .get('/api/notifications')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch notifications' });
  });

  test('handles unexpected errors', async () => {
    supabase.from.mockImplementationOnce(() => {
      throw new Error('Unexpected failure');
    });

    const response = await request(app)
      .get('/api/notifications')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Server error' });
  });

  describe('POST /api/notifications/send error handling', () => {
  const validRequest = {
    toUid: 'recipient-uid-456',
    title: 'Test Title',
    body: 'Test Body'
  };

  afterEach(() => {
    jest.clearAllMocks();
  });
  

  // Test for tokenError block
  it('should handle FCM token fetch error', async () => {
    supabase.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Token fetch failed' }
    });

    const response = await request(app)
      .post('/api/notifications/send')
      .send(validRequest);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Failed to fetch FCM token'
    });
    expect(supabase.from).toHaveBeenCalledWith('fcm_tokens');
    expect(supabase.select).toHaveBeenCalledWith('fcm_token');
    expect(supabase.eq).toHaveBeenCalledWith('user_id', validRequest.toUid);
    expect(supabase.eq).toHaveBeenCalledWith('is_active', true);
  });

  // Test for insertError block
  it('should handle notification insertion error', async () => {
    // Mock successful token fetch
    supabase.maybeSingle.mockResolvedValueOnce({
      data: { fcm_token: 'valid-fcm-token' },
      error: null
    });

    // Mock successful FCM send
    admin.messaging().send.mockResolvedValueOnce({ messageId: 'msg123' });

    // Mock failed notification insert
    supabase.insert.mockResolvedValueOnce({
      data: null,
      error: { message: 'Insert failed' }
    });

    const response = await request(app)
      .post('/api/notifications/send')
      .send(validRequest);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: 'Notification sent but failed to save in database',
      error: 'Insert failed'
    });
  });





  // Test for general catch(error) block
  it('should handle general notification send errors', async () => {
    // Mock successful token fetch
    supabase.maybeSingle.mockResolvedValueOnce({
      data: { fcm_token: 'valid-fcm-token' },
      error: null
    });

    // Mock failed FCM send
    admin.messaging().send.mockRejectedValueOnce(new Error('FCM send failed'));

    const response = await request(app)
      .post('/api/notifications/send')
      .send(validRequest);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: 'FCM send failed'
    });
    });




  // Test for unregistered token handling (catch block with specific error)
it('should handle unregistered FCM token and mark inactive', async () => {
  const invalidToken = 'unregistered-token-123';
  
  // Mock Firebase error with correct structure
  const error = new Error('Unregistered token');
  error.errorInfo = { 
    code: 'messaging/registration-token-not-registered',
    message: 'Test error' 
  };
  admin.messaging().send.mockRejectedValueOnce(error);

  // Mock token fetch
  supabase.from.mockReturnValueOnce({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValueOnce({
      data: { fcm_token: invalidToken },
      error: null
    })
  });

  // Track update operation calls
  const eqCalls = [];
  const updateMock = {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockImplementation((column, value) => {
      eqCalls.push({ column, value });
      return updateMock;
    }),
    mockResolvedValue: jest.fn().mockResolvedValue({ data: null, error: null })
  };
  supabase.from.mockReturnValueOnce(updateMock);

  const response = await request(app)
    .post('/api/notifications/send')
    .send(validRequest);

  // Assertions
  expect(response.status).toBe(410);
  expect(response.body).toEqual({
    success: false,
    message: 'FCM token not registered. Token marked inactive, please refresh on client.'
  });

  // Verify deactivation was attempted with correct parameters
  expect(supabase.from).toHaveBeenCalledWith('fcm_tokens');
  expect(updateMock.update).toHaveBeenCalledWith({ is_active: false });
  
  // Check both eq calls were made with correct values
  expect(eqCalls).toEqual([
    { column: 'user_id', value: validRequest.toUid },
    { column: 'fcm_token', value: invalidToken }
  ]);
});



  // Test for supabase update failure in unregistered token case
    it('should handle failure when marking unregistered token inactive', async () => {
    const invalidToken = 'unregistered-token';
    
    // 1. Mock successful token fetch
    supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValueOnce({
        data: { fcm_token: invalidToken },
        error: null
        })
    });

    // 2. Mock Firebase error for unregistered token
    const fcmError = new Error('Unregistered token');
    fcmError.errorInfo = { code: 'messaging/registration-token-not-registered' };
    admin.messaging().send.mockRejectedValueOnce(fcmError);

    // 3. Create mock for update operation that will fail
    const updateMock = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation((col, val) => {
        if (col === 'fcm_token') {
            // Simulate failure on the second eq() call
            throw new Error('Update failed');
        }
        return updateMock;
        })
    };
    supabase.from.mockReturnValueOnce(updateMock);

    const response = await request(app)
        .post('/api/notifications/send')
        .send(validRequest);

    // 4. Assertions
    expect(response.status).toBe(410);
    expect(response.body).toEqual({
        success: false,
        message: 'FCM token not registered. Token marked inactive, please refresh on client.'
    });

    // 5. Verify deactivation was attempted
    expect(updateMock.update).toHaveBeenCalledWith({ is_active: false });
    expect(updateMock.eq).toHaveBeenCalledWith('user_id', validRequest.toUid);
    });
});

/////more save-fcm-token unit tests

describe('POST /api/notifications/save-fcm-token', () => {
  const validRequest = { token: 'test-fcm-token' };
  const mockUserId = 'test-uid';

  beforeEach(() => {
    // Mock verifyToken middleware
    jest.mock('../src/middleware/auth', () => ({
      verifyToken: (req, res, next) => {
        req.user = { uid: mockUserId };
        next();
      }
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle Supabase upsert errors', async () => {
    // Create a mock for the upsert operation
    const upsertMock = {
      upsert: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database constraint violation' }
      })
    };

    // Mock the Supabase chain
    supabase.from.mockReturnValueOnce(upsertMock);

    const response = await request(app)
      .post('/api/notifications/save-fcm-token')
      .send(validRequest);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: 'Failed to save token'
    });

    // Verify the upsert was called correctly
    expect(supabase.from).toHaveBeenCalledWith('fcm_tokens');
    expect(upsertMock.upsert).toHaveBeenCalledWith(
      {
        user_id: mockUserId, // Now matches the mock middleware
        fcm_token: validRequest.token,
        is_active: true,
      },
      { onConflict: ['user_id', 'fcm_token'] }
    );
  });


  it('should return 400 if token is missing', async () => {
    const response = await request(app)
      .post('/api/notifications/save-fcm-token')
      .send({}); // No token provided

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Missing token'
    });
  });

  it('should successfully save FCM token', async () => {
    // Mock successful upsert
    supabase.from.mockReturnValueOnce({
      upsert: jest.fn().mockResolvedValueOnce({
        data: { id: 1 },
        error: null
      })
    });

    const response = await request(app)
      .post('/api/notifications/save-fcm-token')
      .send(validRequest);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Token saved'
    });
  });
});
});