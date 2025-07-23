// Authentication provider
import React, {createContext, useState, useEffect, useContext} from "react";
import { useNavigate } from "react-router-dom";

//this is for the notifications + FCM tokens
import { getToken } from "firebase/messaging";
import { messaging } from "../firebase"; // your new firebase messaging setup

// Create context
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();


     // Helper to send token to backend
    const sendFcmTokenToServer = async (token, userToken) => {
        try {
        await fetch("http://localhost:8080/api/notifications/save-fcm-token", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify({ token }),
        });
        console.log("FCM token saved on server");
        } catch (err) {
        console.error("Failed to send FCM token:", err);
        }
    };

    

    // On mount, check localStorage for user
    useEffect(() => {
        // Call this to get or refresh the FCM token
        const refreshFcmToken = async (currentUser) => {
            if (!currentUser) return;
            try {
            const newToken = await getToken(messaging, {
                vapidKey: "BO-QPzoEL6lO0nyJ1m1QSTfw34zxHFEiLalwxiFT02Yw200nu_e3rzyNx8EnKfvPmxN_Bu7oKuVd6F9s1xrNt1k",
            });
            if (newToken) {
                // Optionally check if token changed from stored one before sending
                await sendFcmTokenToServer(newToken, currentUser.token);
                console.log("FCM token fetched/refreshed:", newToken);
            }
            } catch (error) {
            console.error("Error getting FCM token:", error);
            }
        };

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            refreshFcmToken(JSON.parse(storedUser)); 
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