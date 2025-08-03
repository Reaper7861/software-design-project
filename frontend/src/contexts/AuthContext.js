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
    const navigate = useNavigate();

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
                        
                        // Fetch user data from backend to get role and other info
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
                        } else {
                            // Fallback to basic Firebase user data if backend call fails
                            const userData = {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName
                            };
                            setUser(userData);
                            localStorage.setItem('user', JSON.stringify(userData));
                        }
                    } catch (error) {
                        console.error('Error fetching user data from backend:', error);
                        // Fallback to basic Firebase user data
                        const userData = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName
                        };
                        setUser(userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                    }
                } else {
                    // Firebase user is not authenticated
                    setUser(null);
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
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        signOut(auth).catch(error => {
            console.error('Error signing out from Firebase:', error);
        });
        navigate("/homepage");
    };

    return(
        <AuthContext.Provider value = {{user, setUser, login, logout, loading}}>
            {children}
        </AuthContext.Provider>
    );
};


// Hook to use context
export const useAuth = () => useContext(AuthContext);