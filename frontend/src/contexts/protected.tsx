import { useUser } from "./context";
import { Navigate } from "react-router-dom";

export function Guest({ children }) {
    const { user } = useUser()

    if (user) return <Navigate to='/' />

    return children
}

export function Protected({ children }) {
    const { user } = useUser()

    if (!user) return <Navigate to='/auth/login' />

    return children
}