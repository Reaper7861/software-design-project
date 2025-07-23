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
            
            // Fetch user info from Supabase
            const supabase = require('../config/databaseBackend');
            const { data: user, error } = await supabase
                .from('usercredentials')
                .select('uid, email, role')
                .eq('uid', decodedToken.uid)
                .single();
            if (error || !user) {
                return res.status(404).json({ error: 'User not found in database' });
            }
            res.status(200).json({
                message: "Login successful",
                uid: user.uid,
                email: user.email,
                role: user.role
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
            const supabase = require('../config/databaseBackend');
            const { data: user, error } = await supabase
                .from('usercredentials')
                .select('uid, email, role')
                .eq('uid', req.user.uid)
                .single();
            if (error) {
                console.error('Supabase error:', error);
                return res.status(500).json({ error: error.message });
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found in database' });
            }
            
            // Fetch profile
            const { data: profile, error: profileError } = await supabase
                .from('userprofile')
                .select('*')
                .eq('uid', req.user.uid)
                .single();
            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Supabase profile error:', profileError);
            }
            res.json({
                user: {
                    uid: user.uid,
                    email: user.email,
                    role: user.role || 'volunteer',
                    profile: profile || null
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