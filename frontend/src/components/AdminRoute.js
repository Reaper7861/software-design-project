import {useAuth} from "../contexts/AuthContext";
import {Navigate} from "react-router-dom";


// Allow adminstrators access 
export const AdminRoute = ({children}) => {
    // Get logged-in user
    const {user} = useAuth();

    // If not logged, redirect to login page
    if(!user){
        return <Navigate to = "/login" replace/>;
    }

    // If logged in, but not admin, redirect to profile page (volunteers)
    if(user.role !== "administrator"){
        return <Navigate to = "/profile" replace />;
    }

    // If admin, render child components
    return children;
};
