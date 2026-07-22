import { useContext, createContext } from "react";
import { useSocket } from "../hooks/ws";
import { useUser } from "./context";

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
    const { token } = useUser()

    const t = token() 

    const chatSocket = useSocket(t)

    return (
        <ChatContext.Provider value={chatSocket}>
            { children }
        </ChatContext.Provider>
    )
}

export const useChat = () => {
    const context = useContext(ChatContext)
    if (!context) {
        throw new Error("useChat musi byc uzyty w useProvider")
    }
    return context
}