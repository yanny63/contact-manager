import { createContext, useContext, useState } from 'react';
import { getMe } from '../ts/api';
import { login as loginApi } from '../ts/api';

interface User {
    id: number
    phone: string 
    prefix: string
    avatar?: string
}

interface UserContextType {
    user: User | null
    loadUser: () => Promise<void>
    logout: () => void
    login: (phone: string, prefix: string, password: string) => Promise<boolean>
    token: () => string
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }) {
    const [user, setUser] = useState<User | null>(null)

    const loadUser = async () => {
        const data = await getMe()
        setUser(data)
    }

    const login = async (phone: string, prefix: string, password: string) => {
        const data = await loginApi(phone, prefix, password)
        if (data) {
            await loadUser()
            return true
        }
        return false
    }

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
    }

    const token = () => {
        return localStorage.getItem('token')
    }

    return (
        <UserContext.Provider value={{ user, loadUser, logout, login, token }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    return useContext(UserContext)!
}