import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from "../contexts/AuthContext";


// Registration form with email, password, and confirm pasword confirmation
const RegisterPage = () => {

    const { login } = useAuth();

    // Form state -> email, password, confirmPassword
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
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

    // Form submission with broad validations
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Check is all fields are filled
        if(!formData.email || !formData.password || !formData.confirmPassword){
            setError('Please fill in all fields');
            return;
        }

            // Email field length validation
        if(formData.email.length > 75){
            setError('Email cannot exceed 75 characters');
            return;
        }

        // Password field length validation
        if(formData.password.length > 75){
            setError('Password cannot exceed 75 characters');
            return;
        }

        // Confirm Password field length validation
        if(formData.confirmPassword.length > 75){
            setError('Password cannot exceed 75 characters');
            return;
        }
        
        // Check if passwords match
        if(formData.password !== formData.confirmPassword){
            setError('Passwords do not match');
            return;
        }

        // Check password has minimum length
        if(formData.password.length < 8){
            setError('Password must be at least 8 characters long.');
            return;
        }

        // Password must consist of uppercase, lowercase, number, and special character
        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

        // Check if password contains the following
        if(!passRegex.test(formData.password)){
            setError('Password must contain: \n• minimum of 1 uppercase letter \n• minimum of 1 lowercase letter \n• minimum of 1 number \n• minimum of 1 special character');
            return;
        }

        setLoading(true);


        try{
            console.log('Registration attempt: ', {
                email: formData.email,
                password: formData.password
            });

            // Firebase registration
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                formData.email,
                formData.password
            );

            const token = await userCredential.user.getIdToken();

            // Create user in Supabase via backend
            await fetch('http://localhost:8080/api/users/create-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ email: formData.email })
            });


            // Set user context to logged in
            login({
                uid: userCredential.user.uid, 
                email: userCredential.user.email,
                role: "volunteer"
            });

            // Navigate to phantom page
            navigate('/phantompage');

        } catch (err) {
            setError('Registration failed ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Create Account</h2>

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
                            maxLength="75"
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
                            maxLength="75"
                            required
                        />
                    </div>

                    {/* Password confirmation input field */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Confirm password"
                            maxLength="75"
                            required
                        />
                    </div>

                    {/* Submit button with loading state */}
                    <button
                        type="submit"
                        style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                {/* Link to login page (if already registered) */}
                <p style={styles.linkText}>
                    Already have an account? <Link to="/login" style={styles.link}>Login Here</Link>
                </p>
            </div>
        </div>
    );
};


// Custom styles for form appearance
const styles = {

    // Style for registration form card
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: '20px'
    },
    
    // Registration form card appearance
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
        backgroundColor: '#27ae60',
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
        border: '1px solid #f5c6cb',
        whiteSpace: 'pre-line'
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

export default RegisterPage;
