// Setup
const authService = require('../services/authService');


class AuthController {
    // Register new user
    async register(req, res){
        try {
            const {email, password} = req.body;

            const result = await authService.registerUser(email, password);

            res.status(201).json({
                message: 'User registered successfully',
                user: result
            });
        } catch (error) {
            console.error('Registration controller error: ', error);

            if(error.message === 'Email already exists') {
                return res.status(409).json({
                    error: 'Registration failed',
                    message: 'Email already exists'
                });
            }

            res.status(400).json({
                error: 'Registration failed',
                message: error.message
            });
        }
    }

    // Login user by verifying Firebase token
    async login(req, res) {
        try {
            // Get token from Auth header
            const authHeader = req.headers.authorization;
            if(!authHeader || !authHeader.startsWith("Bearer ")){
                return res.status(400).json({error: "Missing/invalid Authorization header"});
            }

            const idToken = authHeader.split(" ")[1];

            // Verify token via Firebase Admin SDK
            const decodedToken = await authService.verifyFirebaseToken(idToken);

            // Show user info
            res.status(200).json({
                message: "Login successful",
                uid: decodedToken.uid,
                email: decodedToken.email,
                admin: decodedToken.admin || false
            });
        } catch(error) {
            console.error("Login error: ", error);
            res.status(401).json({
                error: "Unauthorized",
                message: error.message
            });
        }
    }

    // Obtain current user information
    async getCurrentUser(req, res) {
        try {
            // User authenticated via middleware
            const user = await authService.getUserByUid(req.user.uid);

            res.json({
                user: {
                    uid: user.uid,
                    email: user.email,
                    role: user.role || 'volunteer',
                    profileCompleted: user.profile.profileCompleted || false
                }
            });
        } catch (error) {
            console.error('Get user error: ', error);
            res.status(404).json({
                error: 'User not found',
                message: error.message
            });
        }
    }
}

module.exports = new AuthController();