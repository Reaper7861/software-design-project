import {useAuth} from "../contexts/AuthContext";
import {Navigate} from "react-router-dom";

// Allow administrators access 
export const AdminRoute = ({children}) => {
    // Get logged-in user and loading state
    const {user, loading} = useAuth();

    // Wait for loading to finish before making a decision
    if (loading) {
        return <div>Loading...</div>;
    }

    // If not logged in, redirect to login page
    if(!user){
        return <Navigate to = "/login" replace/>;
    }

    // If logged in, but not admin, redirect to profile page (volunteers)
    if(user.role !== "administrator" && user.role !== "admin"){
        return <Navigate to = "/profile" replace />;
    }

    // If admin, render child components
    return children;
};
