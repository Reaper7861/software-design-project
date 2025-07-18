// mockData unit tests
// Separate file from server.test.js to avoid errors 

const mockDataModule = require('../src/data/mockData');

// Helper to reset mockData state between tests
function resetMockData() {
  // Clear users, events, eventRegistrations, userHistory
  mockDataModule.users = new Map();
  mockDataModule.events = new Map();
  mockDataModule.eventRegistrations = new Map();
  mockDataModule.userHistory = new Map();
  mockDataModule.counters = { eventId: 100 };
}

describe('mockData user functions', () => {
  beforeEach(() => {
    resetMockData();
  });

  // Test: Create, get, and update a user
  it('should create, get, and update a user', () => {
    const user = mockDataModule.createUser('user1', { email: 'fake@example.com', fullName: 'Test User', role: 'admin' });
    // Expected user to be defined
    expect(user).toBeDefined();
    expect(user.email).toBe('fake@example.com');
    expect(user.profile.fullName).toBe('Test User');
    expect(user.role).toBe('admin');

    const fetched = mockDataModule.getUser('user1');
    // Expected fetched user to be equal to created user
    expect(fetched).toEqual(user);

    const updated = mockDataModule.updateUser('user1', { fullName: 'Updated Name' });
    // Expected updated user to have updated name
    expect(updated.profile.fullName).toBe('Updated Name');
    expect(mockDataModule.getUser('user1').profile.fullName).toBe('Updated Name');
  });

  // Test: Update user returns null if user does not exist
  it('updateUser returns null if user does not exist', () => {
    // Expected null if user does not exist
    expect(mockDataModule.updateUser('missing', { fullName: 'Nobody' })).toBeNull();
  });
});

describe('mockData event functions', () => {
  beforeEach(() => {
    resetMockData();
  });

  // Test: Create, get, update, and delete an event
  it('should create, get, update, and delete an event', () => {
    const event = mockDataModule.createEvent({
      eventName: 'Fake Event',
      eventDescription: 'Do fake stuff',
      eventDate: '2025-01-01',
      location: 'Houston',
      requiredSkills: ['Communication'],
      urgency: 'High',
      createdBy: 'user1',
    });
    // Expected attributes
    expect(event).toBeDefined();
    expect(event.eventName).toBe('Fake Event');
    const fetched = mockDataModule.getEvent(event.eventId);
    expect(fetched).toEqual(event);

    const updated = mockDataModule.updateEvent(event.eventId, { eventName: 'Updated Event' });
    // Expected updates
    expect(updated.eventName).toBe('Updated Event');
    expect(mockDataModule.getEvent(event.eventId).eventName).toBe('Updated Event');

    // Expected delete to return true
    expect(mockDataModule.deleteEvent(event.eventId)).toBe(true);
    // Expected event to be undefined
    expect(mockDataModule.getEvent(event.eventId)).toBeUndefined();
    // Expected delete to return false if it does not exist
    expect(mockDataModule.deleteEvent('missing')).toBe(false);
  });

  // Test: Get all events
  it('getAllEvents returns all events', () => {
    const e1 = mockDataModule.createEvent({ eventName: 'Event1', eventDescription: '', eventDate: '', location: '', requiredSkills: [], urgency: '', createdBy: 'user1' });
    const e2 = mockDataModule.createEvent({ eventName: 'Event2', eventDescription: '', eventDate: '', location: '', requiredSkills: [], urgency: '', createdBy: 'user1' });
    const all = mockDataModule.getAllEvents();
    // Expected all events to be returned
    expect(all.length).toBe(2);
    expect(all.map(e => e.eventName)).toEqual(expect.arrayContaining(['Event1', 'Event2']));
  });

  // Test: Updated event -> null if event does not exist
  it('updateEvent returns null if event does not exist', () => {
    // Expected null if event does not exist
    expect(mockDataModule.updateEvent('missing', { eventName: 'Nothing' })).toBeNull();
  });
});

describe('mockData registration and history functions', () => {
  beforeEach(() => {
    resetMockData();
  });

  // Test: Register user for event and update history
  it('should register a user for an event and update history', () => {
    mockDataModule.createUser('user2', { email: 'fake2@example.com', fullName: 'User' });
    const event = mockDataModule.createEvent({ eventName: 'Event', eventDescription: '', eventDate: '', location: '', requiredSkills: [], urgency: '', createdBy: 'u1' });
    expect(mockDataModule.registerForEvent('user2', event.eventId)).toBe(true);
    // Registered in event
    expect(event.registeredVolunteers).toContain('user2');
    // Registered in eventRegistrations
    expect(mockDataModule.getEventRegistrations(event.eventId)).toContain('user2');
    // User history updated
    const history = mockDataModule.getUserHistory('user2');
    expect(history.length).toBe(1);
    expect(history[0].eventId).toBe(event.eventId);
  });

  // Test: Register for event -> false, if user or event missing
  it('registerForEvent returns false if user or event missing', () => {
    expect(mockDataModule.registerForEvent('user2', 'event1')).toBe(false);
    mockDataModule.createUser('user2', { email: 'fake2@example.com', fullName: 'User' });
    expect(mockDataModule.registerForEvent('user2', 'event1')).toBe(false);
    const event = mockDataModule.createEvent({ eventName: 'Event', eventDescription: '', eventDate: '', location: '', requiredSkills: [], urgency: '', createdBy: 'user1' });
    expect(mockDataModule.registerForEvent('missing', event.eventId)).toBe(false);
  });

  // Test: Get event registrations -> empty array if none
  it('getEventRegistrations returns empty array if none', () => {
    const event = mockDataModule.createEvent({ eventName: 'Event', eventDescription: '', eventDate: '', location: '', requiredSkills: [], urgency: '', createdBy: 'user1' });
    // Expected empty array if no registrations
    expect(mockDataModule.getEventRegistrations(event.eventId)).toEqual([]);
  });

  // Test: Get user history -> empty array if none
  it('getUserHistory returns empty array if none', () => {
    // Expected empty array if no history
    expect(mockDataModule.getUserHistory('user2')).toEqual([]);
  });
});

