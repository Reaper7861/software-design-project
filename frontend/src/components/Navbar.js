import React, { useContext } from 'react';
import { Button } from '@mui/material'
import { AuthContext } from "../contexts/AuthContext";
import {Link} from 'react-router-dom';

// Displays title and navigation buttons
const Navbar = () => {
    const {user, logout} = useContext(AuthContext);

    return (
        <nav style={styles.navbarOuter}>
            <div style={styles.titlesContainer}>
                {/* Title */}
                <h2 style={styles.title}>ServeTogether</h2>
            </div>
                <div style={styles.navbar}>
                    <div style={styles.left}>
                    
                    {/* Landing page */}
                    <Button component={Link} to="/homepage" color='beige'>Homepage</Button>
                    </div>
                <div style={styles.center}>
                {user && (
                    <>
                        {/* Primary app functionality buttons */}
                        <Button component={Link} to="/profile" color='beige'>Profile</Button>
                        <Button component={Link} to="/notifications" color='beige'>Notifications</Button>
                        <Button component={Link} to="/history" color='beige'>Volunteer History</Button>
                    
                    {/* Administrator only */}
                    {(user.role === "administrator" || user.role === "admin") && (
                        <>
                            <Button component={Link} to="/events" color='beige'>Event Management</Button>
                            <Button component={Link} to="/matching" color='beige'>Volunteer Match</Button>
                        </>
                    )}
                </>
                )}
                </div>

            <div style={styles.right}>
                {!user ? (
                    <>
                        {/* Authentication buttons */}
                        <Button component={Link} to="/login" color='beige'>Login</Button>
                        <Button component={Link} to="/register" color='beige'>Register</Button>
                    </>
                ) : (
                    <Button onClick={logout} color="beige">Logout</Button>
                )}
            </div>
            </div>
    </nav>
    );
};

// Custom styles 
const styles = {
    
    navbarOuter: {
        backgroundColor: '#483C32',
        color: '#F4F5DC',
        fontFamily: 'Roboto' // Changed font
    },

    titleContainer: {
        textAlign: 'center',
        padding: '0.5rem 0'
    },

    navbar: {
        padding: '0.5rem 1rem',
        fontSize: '30px', //text size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },

    // Main buttons (profile, notifications, etc.)
    center: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        flex: 1
    },

    // Homepage button
    left: {
        display: 'flex',
        gap: '1rem'
    },

    // Login, Register, Logout buttons
    right: {
        display: 'flex',
        gap: '1rem'
    },
    
    title: {
        margin: 0,
        textAlign: 'center',
        fontSize: '35px',
        fontFamily: 'Roboto' // Changed font
    },
}

export default Navbar;