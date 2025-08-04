import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm';

const PhantomPage = () => {
  const navigate = useNavigate();

  const handleSubmit = async () => {
    navigate('/profile');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Complete Your Profile</h2>
        <ProfileForm onSubmit={handleSubmit} />
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
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#2c3e50',
  },
};

export default PhantomPage;