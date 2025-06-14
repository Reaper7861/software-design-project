import React from 'react';
import { Button } from '@mui/material'

const Navbar = () => {
    return (
        <nav style={styles.navbar}>
            <div style={styles.container}>
                <h2 style={styles.title}>ServeTogether</h2>
                <div style={styles.buttonContainer}>
                    <Button href="/login">Login</Button>
                    <Button href="/register">Register</Button>
                    <Button href="/profile">Profile</Button>
                    <Button href="/events">Event Management</Button>
                    <Button href="/matching">Volunteer Match</Button>
                    <Button href="/notifications">Notifications</Button>
                    <Button href="/history">Volunteer History</Button>
                </div>
            </div>
        </nav>
    );
};

const styles = {
    
    navbar: {
        backgroundColor: '#502c2c',
        color: 'white',
        padding: '1rem'
    },

    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
    },

    title: {
        margin: 0,
        textAlign: 'center'
    },

    buttonContainer: {
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
    },

    button: {
        color: 'white',
        borderColor: 'white'
    }
}

export default Navbar;