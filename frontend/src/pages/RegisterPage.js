import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');


        if(!formData.email || !formData.password || !formData.confirmPassword){
            setError('Please fill in all fields');
            return;
        }
        
        if(formData.password !== formData.confirmPassword){
            setError('Passwords do not match');
            return;
        }

        if(formData.password.length < 8){
            setError('Password must be at least 8 characters long.');
            return;
        }

        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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

            setTimeout(() => {
                navigate('/login', {
                    state: { message: 'Registration successful. Please log in.'}
                });
                setLoading(false);
            }, 1000);

        } catch (err) {
            setError('Registration failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Create Account</h2>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
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

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="Confirm password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>


                <p style={styles.linkText}>
                    Already have an account? <Link to="/login" style={styles.link}>Login Here</Link>
                </p>
            </div>
        </div>
    );
};


const styles = {

    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: '20px'
    },
    
    card: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
    },

    title: {
        textAlign: 'center',
        marginBottom: '1.5rem',
        color: '#2c3e50'
    },

    formGroup: {
        marginBottom: '1rem'
    },

    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '500',
        color: '#555'
    },

    input: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1rem',
        boxSizing: 'border-box'
    },

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

    buttonDisabled: {
        backgroundColor: '#bdc3c7',
        cursor: 'not-allowed'
    },

    error: {
        backgroundColor: '#fee',
        color: '#c0392b',
        padding: '0.75rem',
        borderRadius: '4px',
        marginBottom: '1rem',
        border: '1px solid #f5c6cb',
        whiteSpace: 'pre-line'
    },

    linkText: {
        textAlign: 'center',
        marginTop: '1rem'
    },

    link: {
        color: '#3498db',
        textDecoration: 'none'
    }
};

export default RegisterPage;
