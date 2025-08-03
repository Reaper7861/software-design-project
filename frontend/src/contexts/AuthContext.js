// Authentication provider
import React, {createContext, useState, useEffect, useContext} from "react";
import { useNavigate } from "react-router-dom";
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Create context
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // On mount, check localStorage for user and Firebase auth state
    useEffect(() => {
        let unsubscribe;
        
        const initializeAuth = () => {
            // First, try to get user from localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            
            // Then listen for Firebase auth state changes
            unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                if (firebaseUser) {
                    // Firebase user is authenticated
                    const userData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName
                    };
                    
                    // Update both state and localStorage
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
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