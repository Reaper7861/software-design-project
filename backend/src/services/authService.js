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
        const userData = getUser(uid);

            if(!userData){
                throw new Error('User not found');
                }

                return {
                    uid: userData.uid,
                    email: userData.email,
                    role: userData.role,
                    profile: userData.profile
                };
            }
    }



module.exports = new AuthService();
