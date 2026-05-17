import { createContext, useContext, useState } from 'react';
import { getMe } from '../ts/api';

interface User {
    id: number
    phone: string 
    prefix: string
    avatar?: string
}

interface UserContextType {
    user: User
    loadUser: () => Promise<void>
    logout : () => void
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }) {
    const [ user, setUser ] = useState<User | null>(null)

    const loadUser = async () => {
        const user = await getMe()
        setUser(user)
    }

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
    }

    return (
        <UserContext.Provider value={{ user, loadUser, logout }}>
            { children }
        </UserContext.Provider>
    )
}

export function useUser() {
    return useContext(UserContext)!
}