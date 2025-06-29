// Email Validation
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 75;
};

// Password validation
const isValidPassword = (password) => {
    if(!password || password.length < 8 || password.length > 75){
        return false; 
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// Skillset
const SKILLS = [
    'Communication',
    'Teamwork',
    'Leadership',
    'Event Planning',
    'Fundraising',
    'Public Speaking',
    'Teaching/Tutoring',
    'Childcare',
    'Elderly Support',
    'Community Outreach'
]

// Skill validation
const isValidSkill = (skill) => {
    return SKILLS.includes(skill);
};

// Skills array validation
const isValidSkillsArray = (skills) => {
    return Array.isArray(skills) && skills.length > 0 && skills.every(skill => isValidSkill(skill));
};

// Location validation
const isValidLocation = (location) => {
    return location && typeof location === 'object' && typeof location.city === 'string' && typeof location.state === 'string' &&
    location.city.length > 0 && location.city.length <= 100 && location.state.length > 0 && location.state.length <= 100;
};

// Availability validation
const isValidAvailability = (availability) => {
    const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const validTimes = ['morning', 'afternoon', 'evening', 'night'];

    if(!availability || typeof availability !== 'object'){
        return false;
    }


    return Object.keys(availability).every(day => 
        validDays.includes(day) && (typeof availability[day] === 'boolean' || (Array.isArray(availability[day]) && availability[day].every(time => validTimes.includes(time))))
    );
};

// Event validation
const isValidEventName = (name) => {
    return name && typeof name === 'string' && name.length >= 1 && name.length <= 100;
};

// Event description validation
const isValidEventDescription = (description) => {
    return description && typeof description === 'string' && description.length >= 10 && description.length <= 2000;
};

// Event date validation
const isValidEventDate = (date) => {
    const eventDate = new Date(date);
    const now = new Date();
    return eventDate instanceof Date && !isNaN(eventDate) && eventDate > now;
};

// Urgency validation
const isValidUrgencyLevel = (urgency) => {
    const validLevels = ['low', 'medium', 'high'];
    return validLevels.includes(urgency);
};


// Validation error messages
const validationMessages = {
    email: 'Email must be valid and no more than 75 characters',
    password: 'Password must be 8-75 characters with uppercase, lowercase, number, and special character',
    skills: 'Skills must be selected from the available options',
    location: 'Location must include city and state (maximum: 100 characters)',
    availability: 'Availability must specify days and time',
    eventName: 'Event name must be cannot exceed 100 characters',
    eventDescription: 'Event description must be 10-2000 characters',
    eventDate: 'Event date must be in the future',
    urgency: 'Urgency must be low, medium, high'
};


module.exports = {
    isValidEmail,
    isValidPassword,
    isValidSkill,
    isValidSkillsArray,
    isValidLocation,
    isValidAvailability,
    isValidEventName,
    isValidEventDescription,
    isValidEventDate,
    isValidUrgencyLevel,
    validationMessages
};