// Setup
const {
    isValidEmail, 
    isValidPassword,
    isValidSkillsArray,
    isValidLocation,
    isValidAvailability,
    isValidEventName,
    isValidEventDescription,
    isValidEventDate,
    isValidUrgencyLevel,
    validationMessages
} = require('../utils/validators')


// Validation middleware
const validate = (validations) => {
    return (req, res, next) => {
        const errors = {};

        for(const field in validations) {
            const validator = validations[field];
            const value = req.body[field];

            if(validator.required && !value){
                errors[field] = `${field} is required`;
                continue;
            }

            if(value && validator.validate && !validator.validate(value)){
                errors[field] = validator.message || `Invalid ${field}`;
            }
        }

        if(Object.keys(errors).length > 0){
            return res.status(400).json({
                error: 'Validation failed',
                errors
            });
        }

        next();
    };
};


// Authentication validation
const validateRegistration = validate({
    email: {
        required: true,
        validate: isValidEmail,
        message: validationMessages.email
    },

    password: {
        required: true,
        validate: isValidPassword,
        message: validationMessages.password
    }
});

// Profile validation
const validateProfile = validate({
    fullName: {
        required: true,
        validate: (name) => name.length >= 2 && name.length <= 50,
        message: 'Full name must be 2-50 characters'
    },
    
    address1: {
        required: true,
        validate: (address) => address.length > 0 && address.length <= 100, 
        message: 'Address 1 is required and must not exceed 100 characters'
    },

    address2: {
        required: false,
        validate: (address) => address.length <= 100,
        message: 'Address 2 must not exceed 100 characters'
    },

    city: {
        required: true,
        validate: (city) => city.length > 0 && city.length <= 100,
        message: 'City is required and must not exceed 100 characters'
    },

    state: {
        required: true,
        validate: (state) => state.length === 2,
        message: 'State is required and must be the 2-character code'
    },

    zipCode: {
        required: true,
        validate: (zip) => /^\d{5}(-\d{4})?$/.test(zip),
        message: 'Zip code is required (5 digits or 9 digit format)'
    },

    skills: {
        required: true,
        validate: isValidSkillsArray,
        message: validationMessages.skills
    },

    preferences: {
        required: false,
        validate: (pref) => typeof pref === 'string' && pref.length <= 500,
        message: 'Preferences must not exceed 500 characters'
    },

    availability: {
        required: true, 
        validate: isValidAvailability,
        message: validationMessages.availability
    }
});

// Completed Profile validation
const validateCompleteProfile = validate({
    fullName: {
        required: true,
        validate: (name) => name.length >= 2 && name.length <= 50,
        message: 'Full name must be 2-50 characters'
    },
    
    address1: {
        required: true,
        validate: (address) => address.length > 0 && address.length <= 100, 
        message: 'Address 1 is required and must not exceed 100 characters'
    },

    city: {
        required: true,
        validate: (city) => city.length > 0 && city.length <= 100,
        message: 'City is required and must not exceed 100 characters'
    },

    state: {
        required: true,
        validate: (state) => state.length === 2,
        message: 'State is required and must be the 2-character code'
    },

    zipCode: {
        required: true,
        validate: (zip) => /^\d{5}(-\d{4})?$/.test(zip),
        message: 'Zip code is required (5 digits or 9 digit format)'
    },

    skills: {
        required: true,
        validate: isValidSkillsArray,
        message: validationMessages.skills
    },

    availability: {
        required: true, 
        validate: isValidAvailability,
        message: validationMessages.availability
    }
});

// Event validation
const validateEvent = validate({
    eventName: {
        required: true,
        validate: isValidEventName,
        message: validationMessages.eventName
    },

    eventDescription: {
        required: true,
        validate: isValidEventDescription,
        message: validationMessages.eventDescription
    },

    eventDate: {
        required: true,
        validate: isValidEventDate,
        message: validationMessages.eventDate
    },

    location: {
        required: true,
        validate: (loc) => typeof loc === 'string' && loc.length > 0 && loc.length <= 200,
        message: 'Location is required and must not exceed 200 characters'
    },

    requiredSkills: {
        required: true,
        validate: isValidSkillsArray,
        message: validationMessages.skills
    },

    urgency: {
        required: true,
        validate: isValidUrgencyLevel,
        message: validationMessages.urgency
    }
});

// Event update validation
const validateEventUpdate = validate({
    eventName: {
        required: true,
        validate: isValidEventName,
        message: validationMessages.eventName
    },

    eventDescription: {
        required: true,
        validate: isValidEventDescription,
        message: validationMessages.eventDescription
    },

    eventDate: {
        required: true,
        validate: isValidEventDate,
        message: validationMessages.eventDate
    },

    location: {
        required: true,
        validate: (loc) => typeof loc === 'string' && loc.length > 0 && loc.length <= 200,
        message: 'Location is required and must not exceed 200 characters'
    },

    requiredSkills: {
        required: true,
        validate: isValidSkillsArray,
        message: validationMessages.skills
    },

    urgency: {
        required: true,
        validate: isValidUrgencyLevel,
        message: validationMessages.urgency
    }
});


module.exports = {
    validate, 
    validateRegistration,
    validateProfile,
    validateCompleteProfile,
    validateEvent,
    validateEventUpdate
}