// Authentication provider
// Only a placeholder/simulation right now

// Pass-through provider
export const AuthProvider = ({ children }) => {
    return children;
};

// Access to authentication state in web app
export const useAuth = () => {

    // Returning hard-coded values for now
    return {
        isAuthenticated: false,
        user: null
    };
};