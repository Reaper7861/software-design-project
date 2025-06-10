import React, {useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
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
        setLoading(true);
        setError('');


        if(!formData.email || !formData.password){
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }


        try{
            console.log('Login attempt:', formData);

            setTimeout(() => {
                navigate('/profile');
                setLoading(false);
            }, 1000);
        
        } catch (err) {
            setError('Login failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Login</h2>

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

                        <button
                            type="submit"
                            style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                </form>

                <p style={styles.linkText}>
                    Don&#39;t have an account? <Link to="/register" style={styles.link}>Register Here</Link>
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
        backgroundColor: '#3498db',
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
        border: '1px solid #f5c6cb'
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

export default LoginPage;