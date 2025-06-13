import React from 'react';
import { Button } from '@mui/material'

const Navbar = () => {
    return (
        <nav style={{ backgroundColor: '#2c3e50', color: 'white', padding: '1rem'}}>
            <h2>Volunteer Homepage</h2>
            <Button href="/notifications">Notifications</Button>
            <Button href="/history">Volunteer History</Button>
        </nav>
        
    );
};

export default Navbar;