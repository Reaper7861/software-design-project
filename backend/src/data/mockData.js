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

    // Notifications tokens (FCM)
    notificationsTokens: new Map(),

    // ID counters
    counters: {
        eventId: 100
    }
};


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
                availability: userData.availability || {},
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

    getEventRegistrations: (eventId) => {
        const registrations = mockData.eventRegistrations.get(eventId);
        return registrations ? Array.from(registrations): [];
    },

    getUserHistory: (userId) => {
        return mockData.userHistory.get(userId) || [];
    },

    // Notification helper functions
    saveNotificationToken: (userId, token) => {
        mockData.notificationsTokens.set(userId, token);
    },

    getNotificationToken: (userId) => {
        return mockData.notificationsTokens.get(userId);
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


    // Reset data (for testing purposes)
    resetData: () => {
        mockData.users.clear();
        mockData.events.clear();
        mockData.eventRegistrations.clear();
        mockData.userHistory.clear();
        mockData.notificationsTokens.clear();
        mockData.counters.eventId = 1000;
    }
};


module.exports = {
    mockData,
    ...dataHelperFunctions
};