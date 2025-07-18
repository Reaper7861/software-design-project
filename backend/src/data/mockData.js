// Set up (no database yet)
const mockData = {
    // User collection
    users: new Map(),

    // Events collection
    events: new Map(),

    // Event registrations
    eventRegistrations: new Map(),

    // User event history
    userHistory: new Map(),

    // ID counters
    counters: {
        eventId: 100
    }
};


// Hardcoded admin user
mockData.users.set('65fRWpFmA2OVNXlEX4RiRv1LK3v2', {
    profile: {
        fullName: 'Admin 1',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zipCode: '',
        skills: [],
        preferences: '',
        availability: [],
        profileCompleted: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});

// Another hardcoded admin user
mockData.users.set('AwOzAjY3eTdSvG8aXVv8GPQ7Rjv2', {
    profile: {
        fullName: 'Admin 2',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zipCode: '',
        skills: [],
        preferences: '',
        availability: [],
        profileCompleted: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});

// Hardcoded volunteer user
mockData.users.set('b9YNzkWjYhVOqAP9b8TlCae0qGF2', {
    profile: {
        fullName: 'Volunteer 1',
        address1: '123 Main Street',
        address2: '',
        city: 'Houston',
        state: 'TX',
        zipCode: '77000',
        skills: ['Teamwork', 'Communication'],
        preferences: 'Work Outdoors',
        availability: [
            '2025-07-20',
            '2025-07-22',
            '2025-07-25'
        ],
        profileCompleted: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});


// Hardcoded event
const staticEventId = 'event_101';
mockData.events.set(staticEventId, {
  eventId: staticEventId,
  eventName: 'Food Drive',
  eventDescription: 'Distribute food',
  eventDate: '2025-07-20',
  location: 'Houston, TX',
  requiredSkills: ['Teamwork', 'Communication'],
  urgency: 'High',
  createdBy: '65fRWpFmA2OVNXlEX4RiRv1LK3v2',
  registeredVolunteers: [],
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});


// Initialize eventRegistrations
mockData.eventRegistrations.set(staticEventId, new Set());


// Helper functions for data management
const dataHelperFunctions = {
    // User helper functions
    createUser: (uid, userData) => {
        mockData.users.set(uid, {
            uid, 
            email: userData.email,
            profile: {
                fullName: userData.fullName || '',
                address1: userData.address1 || '',
                address2: userData.address2 || '',
                city: userData.city || '',
                state: userData.state || '',
                zipCode: userData.zipCode || '',
                skills: userData.skills || [],
                preferences: userData.preferences || '',
                availability: userData.availability || [],
                profileCompleted: false
            },
            role: userData.role || 'volunteer',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });


        // Initialize empty history for new user
        mockData.userHistory.set(uid, []);

        return mockData.users.get(uid);
    },

    getUser: (uid) => mockData.users.get(uid),

    updateUser: (uid, updates) => {
        const user = mockData.users.get(uid);

        if(!user) return null;

        const updatedUser = {
            ...user,
            profile: {
                ...user.profile,
                ...updates
            },
            updatedAt: new Date().toISOString()
        };

        mockData.users.set(uid, updatedUser);
        return updatedUser;
    },


    // Event helper functions
    createEvent: (eventData) => {
        const eventId = `event_${++mockData.counters.eventId}`;
        const event = {
            eventId,
            eventName: eventData.eventName,
            eventDescription: eventData.eventDescription,
            eventDate: eventData.eventDate,
            location: eventData.location,
            requiredSkills: eventData.requiredSkills,
            urgency: eventData.urgency,
            createdBy: eventData.createdBy,
            registeredVolunteers: [],
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        mockData.events.set(eventId, event);
        mockData.eventRegistrations.set(eventId, new Set());

        return event;
    },

    getEvent: (eventId) => mockData.events.get(eventId),

    getAllEvents: () => Array.from(mockData.events.values()),

    updateEvent: (eventId, updates) => {
        const event = mockData.events.get(eventId);

        if(!event) return null;

        const updatedEvent = {
            ...event, 
            ...updates,
            updatedAt: new Date().toISOString()
        };

        mockData.events.set(eventId, updatedEvent);
        return updatedEvent;
    },


    // Registration helper functions
    registerForEvent: (userId, eventId) => {
        const event = mockData.events.get(eventId);
        const user = mockData.users.get(userId);

        if(!event || !user) return false;

        // Event registrations
        mockData.eventRegistrations.get(eventId).add(userId);

        // Update registered volunteers of events
        event.registeredVolunteers.push(userId);
        mockData.events.set(eventId, event);

        // User's history
        const userEvents = mockData.userHistory.get(userId) || [];
        userEvents.push({
            eventId, 
            eventName: event.eventName,
            eventDate: event.eventDate,
            registeredAt: new Date().toISOString(),
            status: 'registered'
        });
        
        mockData.userHistory.set(userId, userEvents);

        return true;
    },

    // Delete event helper functions
    deleteEvent: (eventId) => {
        if (mockData.events.has(eventId)) {
            mockData.events.delete(eventId);
            mockData.eventRegistrations.delete(eventId); 
            return true;
        }
        return false;
    },

    getEventRegistrations: (eventId) => {
        const registrations = mockData.eventRegistrations.get(eventId);
        return registrations ? Array.from(registrations): [];
    },

    getUserHistory: (userId) => {
        return mockData.userHistory.get(userId) || [];
    },


    // Volunteer Matching Helper Functions
    findMatchingVolunteers: (event) => {
        const matches = [];

        mockData.users.forEach((user, userId) => {
            // If already registered, skip
            if(mockData.eventRegistrations.get(event.eventId)?.has(userId)){
                return;
            }

            let matchingScore = 0;

            // Checking skill match
            const userSkills = user.profile.skills || [];
            const requiredSkills = event.requiredSkills || [];
            const matchingSkills = requiredSkills.filter(skill => 
                userSkills.includes(skill)
            );
            matchingScore += matchingSkills.length * 10;


            // Location match
            const userLocation = `${user.profile.city}, ${user.profile.state}`.toLowerCase();
            const eventLocation = event.location.toLowerCase();
            if(userLocation === eventLocation || 
                event.location.includes(user.profile.city) || 
                event.location.includes(user.profile.state)){
                    matchingScore += 20;
                }


            // Checking availability matches
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayOfTheWeek = dayNames[new Date(event.eventDate).getDay()];

            if(user.profile.availability?.[dayOfTheWeek]) {
                matchingScore += 15;
            }

            if(matchingScore > 0){
                matches.push({
                    userId,
                    userEmail: user.email,
                    userName: user.profile.fullName,
                    matchingScore,
                    matchingSkills,
                    locationMatch: event.location.includes(user.profile.city) || event.location.includes(user.profile.state)
                });
            }
        });

        // Sorting by matching score (descending order)
        return matches.sort((a, b) => b.matchingScore - a.matchingScore);
    },

    // Store volunteer-event match
    assignVolunteerToEvent: (userId, eventId) => {
        if (!mockData.users.has(userId) || !mockData.events.has(eventId)) {
            return null;
        }

        if (!mockData.eventRegistrations.has(eventId)) {
            mockData.eventRegistrations.set(eventId, new Set());
        }

        mockData.eventRegistrations.get(eventId).add(userId);

        return {
            userId,
            eventId,
            event: mockData.events.get(eventId)
        };
    },

    // Get all matched volunteers for an event
    getEventMatches: (eventId) => {
        const matched = mockData.eventRegistrations.get(eventId);
        if (!matched) return [];
        return Array.from(matched).map(userId => ({
            userId,
            user: mockData.users.get(userId)
        }));
    },

    // Unmatch volunteer
    unmatchVolunteerFromEvent: (userId, eventId) => {
        if (
            !mockData.users.has(userId) ||
            !mockData.events.has(eventId)
        ) return false;

        const registrationSet = mockData.eventRegistrations.get(eventId);
        if (!registrationSet) return false;

        registrationSet.delete(userId);
        return true;
    },


    // Reset data (for testing purposes)
    resetData: () => {
        mockData.users.clear();
        mockData.events.clear();
        mockData.eventRegistrations.clear();
        mockData.userHistory.clear();
        mockData.counters.eventId = 1000;
    }
};


module.exports = {
    mockData,
    ...dataHelperFunctions
};