// Setup
const {auth} = require('../config/firebase');
const {createUser, getUser} = require('../data/mockData');


class AuthService {
    // Register new user
    async registerUser(email, password){
        try{
            const userRecord = await auth.createUser({
                email,
                password,
                emailVerified: false
            });
            
            // Create user profile
            const userProfile = createUser(userRecord.uid, {
                email,
                fullName: '',
                address1: '',
                address2: '',
                city: '',
                state: '',
                zipCode: '',
                skills: [],
                preferences: '',
                availability: {},
                role: 'volunteer'
            });

            return {
                success: true,
                user: {
                    uid: userRecord.uid,
                    email: userRecord.email,
                    profile: userProfile.profile
                }
            };
        } catch (error) {
            console.error('Registration error: ', error);

            if(error.code === 'auth/email-already-exists'){
                throw new Error('Email already exists');
            }

            throw new Error('Registration failed');
        }
    }

    // Verify Firebase ID token and return decoded info
    async verifyFirebaseToken(idToken) {
        return await auth.verifyIdToken(idToken);
    }

    // Obtain user by Firebase UID
    async getUserByUid(uid){
        const userData = getUser(uid);

            // If user info not found
            if(!userData){
                // Get from Firebase
                const firebaseUser = await auth.getUser(uid);

                // Default profile
                return {
                    uid, 
                    email: firebaseUser.email || 'unknown@example.com',
                    role: 'volunteer',
                    profile: {
                        fullname: 'Not in mockdata user',
                        address1: '',
                        address2: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        skills: [],
                        preferences: '',
                        profileCompleted: false
                    }
                };
                }

                // Other, actual user info
                return {
                    uid: userData.uid,
                    email: userData.email,
                    role: userData.role,
                    profile: userData.profile
                };
            }
    }



module.exports = new AuthService();
