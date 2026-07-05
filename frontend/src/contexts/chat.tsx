import { useContext, createContext } from "react";
import { useSocket } from "../hooks/ws";
import { useUser } from "./context";

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
    const { token } = useUser()

    const t = token() 
    console.log('Token (chat.tsx): ', t)

    const chatSocket = useSocket(t)

    return (
        <ChatContext.Provider value={chatSocket}>
            { children }
        </ChatContext.Provider>
    )
}