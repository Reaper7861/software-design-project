// Authentication provider
import React, {createContext, useState, useContext} from "react";
import { useNavigate } from "react-router-dom";


// Create context
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const login = (userData) => {
        setUser(userData);
    }

    const logout = () => {
        setUser(null);
        navigate("/homepage");
    };

    return(
        <AuthContext.Provider value = {{user, setUser, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};


// Hook to use context
export const useAuth = () => useContext(AuthContext);