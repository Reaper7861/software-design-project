import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';

function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 2,
          backgroundColor: 'rgba(138, 154, 91, 0.3)',
        }}
      >
        <Container>
          <Typography color="primary" variant="h3" gutterBottom  sx={{
            color: 'beige.main',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6)',
            }} >
            Welcome to ServeTogether
          </Typography>


          <Typography variant="h6" color="secondary" gutterBottom  sx={{
                color: 'darkbeige.main',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6)',
            }}>
            For volunteer scheduling, event management, and more.
          </Typography>

            
          <Button variant="contained" color="secondary" size="large" href="/login">
            Get Started
          </Button>
           
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 2, backgroundColor: '#E6E2D3', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} SoftwareDesign. All rights reserved.
        </Typography>
      </Box>
    </>
  );
}

export default HomePage;