import React, {useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {signInWithEmailAndPassword} from 'firebase/auth';
import {auth} from '../firebase';
import {useAuth} from "../contexts/AuthContext";
import { getFcmToken } from '../utils/notifications'; //for the FCM token

// Form with email and password validation
const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // Error message
    const [error, setError] = useState('');
    // Loading state
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Update fields on input change
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };


    const {login} = useAuth();

    // Form submission with basic validation
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Basic validations - fields are required
        if(!formData.email || !formData.password){
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        // Email field length validation
        if(formData.email.length > 75){
            setError('Email cannot exceed 75 characters');
            setLoading(false);
            return;
        }

        // Password field length validation
        if(formData.password.length > 75){
            setError('Password cannot exceed 75 characters');
            setLoading(false);
            return;
        }

        try{
            console.log('Login attempt:', formData);

            // Firebase authentication
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const token = await userCredential.user.getIdToken(true);

            // Send token to backend to validate session
            const loginRes = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const loginData = await loginRes.json();

            console.log("LOGIN RESPONSE:", loginData);

             if(!loginRes.ok){
                throw new Error('Failed to fetch user');
            }


            // Send token to backend to get user profile
            const profileRes = await fetch('http://localhost:8080/api/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const profileData = await profileRes.json();

            console.log("PROFILE RESPONSE:", profileData);

            if(!profileRes.ok){
                throw new Error('Failed to fetch user profile');
            }


            // Store user in context and localStorage
            login({
                uid: loginData.uid,
                email: loginData.email,
                role: loginData.role ? "administrator" : "volunteer",
                profile: profileData.user.profile
            });

        //** Get FCM token here ! and send it to backend **//
        const fcmToken = await getFcmToken();

        if (fcmToken) {
            await fetch('http://localhost:8080/api/notifications/save-fcm-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ token: fcmToken })
            });
            console.log('FCM token sent after login', fcmToken);
        } else {
            console.warn('No FCM token retrieved after login');
        }
        /** End notification stuff **/


            navigate('/profile');
            setLoading(false);
        
        } catch (err) {
            setError('Login failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Login</h2>

                {/* Error message */}
                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Email input field */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Enter email"
                            required
                            />
                        </div>

                        {/* Password input field */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Password</label>
                            <input 
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                style={styles.input}
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        {/* Submit button with loading state */}
                        <button
                            type="submit"
                            style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                </form>

                {/* Link to registration page (if not registered) */}
                <p style={styles.linkText}>
                    Don&#39;t have an account? <Link to="/register" style={styles.link}>Register Here</Link>
                </p>
            </div>
        </div>
    );
};

// Custom styles for form appearance
const styles = {

    // Style for login form card
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: '20px'
    },

    // Login form card appearance
    card: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
    },

    // Page title styling
    title: {
        textAlign: 'center',
        marginBottom: '1.5rem',
        color: '#2c3e50'
    },

    // Spacing between form groups
    formGroup: {
        marginBottom: '1rem'
    },

    // Form label styling
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '500',
        color: '#555'
    },

    // Input field styling
    input: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1rem',
        boxSizing: 'border-box'
    },

    // Button styling
    button: {
        width: '100%',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        padding: '0.75rem',
        borderRadius: '4px',
        fontSize: '1rem',
        cursor: 'pointer',
        marginTop: '1rem'
    },

    // Disabled button appearance
    buttonDisabled: {
        backgroundColor: '#bdc3c7',
        cursor: 'not-allowed'
    },

    // Error message styling
    error: {
        backgroundColor: '#fee',
        color: '#c0392b',
        padding: '0.75rem',
        borderRadius: '4px',
        marginBottom: '1rem',
        border: '1px solid #f5c6cb'
    },

    // Appearance of register link
    linkText: {
        textAlign: 'center',
        marginTop: '1rem'
    },

    // Styling for register link
    link: {
        color: '#3498db',
        textDecoration: 'none'
    }
};

export default LoginPage;