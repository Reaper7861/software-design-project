import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';

export const ProfileRoute = ({ children }) => {
  const { user } = useAuth();
  const [profileCompleted, setProfileCompleted] = useState(null);
  const [loading, setLoading] = useState(true);

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
        } else {
          console.error('Failed to check profile status');
          setProfileCompleted(false);
        }
      } catch (error) {
        console.error('Error checking profile status:', error);
        setProfileCompleted(false);
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
    return <Navigate to="/phantompage" />;
  }

  return children;
}; 