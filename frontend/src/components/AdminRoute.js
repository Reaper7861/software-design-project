import {useAuth} from "../contexts/AuthContext";
import {Navigate} from "react-router-dom";


export const AdminRoute = ({children}) => {
    const {user} = useAuth();

    if(!user){
        return <Navigate to = "/login" replace/>;
    }

    if(user.role !== "administrator"){
        return <Navigate to = "/profile" replace />;
    }


    return children;
};
