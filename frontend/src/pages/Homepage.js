import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const buttonText = user ? 'Go to Profile' : 'Get Started';
  const buttonLink = user ? '/profile' : '/login';

  return (
    <>
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
          <Typography color="primary" variant="h3" gutterBottom sx={{
            color: 'beige.main',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6)',
          }}>
            Welcome to ServeTogether
          </Typography>
          <Typography variant="h6" color="secondary" gutterBottom sx={{
            color: 'darkbeige.main',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6)',
          }}>
            For volunteer scheduling, event management, and more.
          </Typography>
          <Button
            component={Link}
            to={buttonLink}
            variant="contained"
            color="secondary"
            size="large"
          >
            {buttonText}
          </Button>
        </Container>
      </Box>
      <Box sx={{ py: 2, backgroundColor: '#E6E2D3', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} SoftwareDesign. All rights reserved.
        </Typography>
      </Box>
    </>
  );
}

export default HomePage;