
export const AuthProvider = ({ children }) => {
    return children;
};

export const useAuth = () => {
    return {
        isAuthenticated: false,
        user: null
    };
};