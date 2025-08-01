import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';

export const ProfileRoute = ({ children }) => {
  const { user } = useAuth();
  const [profileCompleted, setProfileCompleted] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setLoading(false);
          return;
        }

        const idToken = await currentUser.getIdToken();
        const response = await fetch('http://localhost:8080/api/users/profile-status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfileCompleted(data.profileCompleted);
          
          // Show error message if profile is not completed
          if (!data.profileCompleted) {
            setShowError(true);
            // Auto-hide error after 3 seconds and redirect
            setTimeout(() => {
              setShowError(false);
            }, 3000);
          }
        } else {
          console.error('Failed to check profile status');
          setProfileCompleted(false);
          setShowError(true);
        }
      } catch (error) {
        console.error('Error checking profile status:', error);
        setProfileCompleted(false);
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };

    checkProfileStatus();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!profileCompleted) {
    return (
      <>
        {showError && (
          <div style={styles.errorContainer}>
            <div style={styles.errorMessage}>
              <h3>⚠️ Profile Incomplete</h3>
              <p>You must complete your profile information before accessing this page.</p>
              <p>Redirecting you to the profile completion form...</p>
            </div>
          </div>
        )}
        <Navigate to="/phantompage" />
      </>
    );
  }

  return children;
};

const styles = {
  errorContainer: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    border: '2px solid #ff6b6b',
    maxWidth: '400px',
    textAlign: 'center'
  },
  errorMessage: {
    color: '#333'
  }
}; 