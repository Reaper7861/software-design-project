// Authentication provider
import React, {createContext, useState, useEffect, useContext} from "react";
import { useNavigate } from "react-router-dom";


// Create context
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // On mount, check localStorage for user
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
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