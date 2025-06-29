import React from 'react';
import { Button } from '@mui/material'


// Displays title and navigation buttons
const Navbar = () => {
    return (
        <nav style={styles.navbar}>
            <div style={styles.container}>
                {/* Title */}
                <h2 style={styles.title}>ServeTogether</h2>

                {/* Navigation buttons container */}
                <div style={styles.buttonContainer}>
                    
                    {/* Landing page */}
                    <Button color='beige' href="/homepage">Homepage</Button>

                    {/* Authentication buttons */}
                    <Button color='beige' href="/login">Login</Button>
                    <Button color='beige' href="/register">Register</Button>

                    {/* Primary app functionality buttons */}
                    <Button color='beige' href="/profile">Profile</Button>
                    <Button color='beige' href="/events">Event Management</Button>
                    <Button color='beige' href="/matching">Volunteer Match</Button>
                    <Button color='beige' href="/notifications">Notifications</Button>
                    <Button color='beige' href="/history">Volunteer History</Button>
                </div>
            </div>
        </nav>
    );
};

// Custom styles 
const styles = {
    
    // Main navbar container
    navbar: {
        backgroundColor: '#483C32',  //taupe 
        color: '#F5F5DC',  //like a beige for the text
        padding: '1rem',
        fontFamily: 'Segoe UI', //font
        fontSize: '30px', //text size
    },

    // Flexbox container
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
    },

    // App title 
    title: {
        margin: 0,
        textAlign: 'center'
    },

    // Button container(s)
    buttonContainer: {
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
    },

    // Button styling
    button: {
        color: 'white',
        borderColor: 'white'
    }
}

export default Navbar;