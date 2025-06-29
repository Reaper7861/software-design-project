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


    // Obtain user by Firebase UID
    async getUserByUid(uid){
        try{
            const userRecord = await auth.getUser(uid);
            const userData = getUser(uid);

            if(!userData){
                const newUserData = createUser(uid, {
                    email: userRecord.email, 
                    fullName: userRecord.displayName || '',
                    role: 'volunteer'
                });

                return {
                    uid: userRecord.uid,
                    email: userRecord.email,
                    profile: newUserData.profile
                };
            }

            return {
                uid: userRecord.uid,
                email: userRecord.email,
                profile: userData.profile
            };
        } catch (error) {
            console.error('Get user error: ', error);
            throw new Error('User not found');
        }
    }

}

module.exports = new AuthService();
