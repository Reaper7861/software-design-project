// Authentication provider
import React, {createContext, useState, useEffect, useContext} from "react";
import { useNavigate } from "react-router-dom";
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Create context
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileCompleted, setProfileCompleted] = useState(null);
    const navigate = useNavigate();

    // Function to refresh profile status
    const refreshProfileStatus = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                setProfileCompleted(null);
                return;
            }

            const token = await currentUser.getIdToken();
            const response = await fetch('http://localhost:8080/api/users/profile-status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProfileCompleted(data.profileCompleted);
            } else {
                console.error('Profile status check failed:', response.status, response.statusText);
                setProfileCompleted(false);
            }
        } catch (error) {
            console.error('Error checking profile status:', error);
            setProfileCompleted(false);
        }
    };

    // Handle logout on window close
    useEffect(() => {
        const handlePageHide = (event) => {
            // Only logout if the page is not persisted
            if (!event.persisted) {
                // Clear localStorage and sign out from Firebase
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
                signOut(auth).catch(error => {
                    console.error('Error signing out from Firebase:', error);
                });
            }
        };

        // Add event listener for pagehide
        window.addEventListener('pagehide', handlePageHide);

        // Cleanup event listener on component unmount
        return () => {
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, []);

    // On mount, check localStorage for user and Firebase auth state
    useEffect(() => {
        let unsubscribe;
        
        const initializeAuth = async () => {
            // First, try to get user from localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            
            // Then listen for Firebase auth state changes
            unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (firebaseUser) {
                    try {
                        // Get the user's token
                        const token = await firebaseUser.getIdToken();
                        
                        // Check if this is a newly created user by looking at creation time
                        const isNewUser = firebaseUser.metadata.creationTime === firebaseUser.metadata.lastSignInTime;
                        
                        if (isNewUser) {
                            // Use basic data and skip auth/me call
                            console.log('Newly created user detected, using basic Firebase data');
                            const userData = {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName,
                                role: 'volunteer' 
                            };
                            setUser(userData);
                            localStorage.setItem('user', JSON.stringify(userData));
                            // For newly created users, assume profile is not completed
                            setProfileCompleted(false);
                        } else {
                            // For existing users, fetch complete data from backend
                            const response = await fetch('http://localhost:8080/api/auth/me', {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            
                            if (response.ok) {
                                const userData = await response.json();
                                const completeUserData = {
                                    uid: firebaseUser.uid,
                                    email: firebaseUser.email,
                                    displayName: firebaseUser.displayName,
                                    role: userData.user.role,
                                    profile: userData.user.profile
                                };
                                
                                // Update both state and localStorage
                                setUser(completeUserData);
                                localStorage.setItem('user', JSON.stringify(completeUserData));
                                
                                // Check profile status for existing users
                                await refreshProfileStatus();
                            } else if (response.status === 404) {
                                // User exists in Firebase
                                console.log('User not found in database yet, using basic Firebase data');
                                const userData = {
                                    uid: firebaseUser.uid,
                                    email: firebaseUser.email,
                                    displayName: firebaseUser.displayName,
                                    role: 'volunteer' 
                                };
                                setUser(userData);
                                localStorage.setItem('user', JSON.stringify(userData));
                                setProfileCompleted(false);
                            } else {
                                // Fallback to basic Firebase user data
                                console.error('Error fetching user data from backend:', response.status, response.statusText);
                                const userData = {
                                    uid: firebaseUser.uid,
                                    email: firebaseUser.email,
                                    displayName: firebaseUser.displayName,
                                    role: 'volunteer' 
                                };
                                setUser(userData);
                                localStorage.setItem('user', JSON.stringify(userData));
                                setProfileCompleted(false);
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching user data from backend:', error);
                        // Fallback to basic Firebase user data
                        const userData = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            role: 'volunteer'
                        };
                        setUser(userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                        setProfileCompleted(false);
                    }
                } else {
                    // Firebase user is not authenticated
                    setUser(null);
                    setProfileCompleted(null);
                    localStorage.removeItem('user');
                    localStorage.removeItem('authToken');
                }
                setLoading(false);
            });
        };

        initializeAuth();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    }

    const logout = () => {
        setUser(null);
        setProfileCompleted(null);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        signOut(auth).catch(error => {
            console.error('Error signing out from Firebase:', error);
        });
        navigate("/homepage");
    };

    return(
        <AuthContext.Provider value = {{user, setUser, login, logout, loading, profileCompleted, refreshProfileStatus}}>
            {children}
        </AuthContext.Provider>
    );
};


// Hook to use context
export const useAuth = () => useContext(AuthContext);