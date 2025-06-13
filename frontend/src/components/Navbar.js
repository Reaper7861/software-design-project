import React from 'react';
import { Button } from '@mui/material'

const Navbar = () => {
    return (
        <nav style={{ backgroundColor: '#502c2c', color: 'white', padding: '1rem'}}>
            <h2>Volunteer Homepage</h2>
            <Button href="/login">Login</Button>
            <Button href="/register">Register</Button>
            <Button href="/notifications">Notifications</Button>
            <Button href="/history">Volunteer History</Button>
        </nav>
        
    );
};

export default Navbar;