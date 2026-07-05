import { useState, useEffect, useRef, useCallback } from 'react';

export function useSocket(token) {

    const [ isConnected, setIsConnected ] = useState<boolean>(false)
    const [ messagesByConversation, setMessagesByConversation ] = useState({})
    const [ typingByConversation, setTypingByConversation ] = useState({})

    const ws = useRef<WebSocket>(null)

    useEffect(() => {
        
        if (!token) return
        console.log("token przed połączeniem:", token);
        ws.current = new WebSocket(`ws://192.168.1.34:8000/ws/chat?token=${token}`)

        ws.current.onopen = () => {
            setIsConnected(true)
            console.log('Websocket connected')
        }

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data)
            const { conversationId, type, senderId } = data

            if (type === "message") {
                setMessagesByConversation((prev) => ({
                    ...prev, [conversationId]: [...(prev[conversationId] || []), data]
                }))
            }

            if (type === "typing") {
                setTypingByConversation((prev) => {
                    const set = new Set(prev[conversationId])
                    set.add(senderId)
                    return { ...prev, [conversationId]: set }
                })
            }

            if (type === "stop_typing") {
                setTypingByConversation((prev) => {
                    const set = new Set(prev[conversationId])
                    set.delete(senderId)
                    return { ...prev, [conversationId]: set }
                })
            }
        }

        ws.current.onerror = (error) => {
            console.error("WS error: ", error)
        }

        ws.current.onclose = () => {
            setIsConnected(false)
            console.log("Websocket disconnected")
        }

        return () => ws.current.close()
    }, [token])

    const sendMessage = useCallback((conversationId, text) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: "message", conversationId, text}))
        }
    }, [])

    const sendTyping = useCallback((conversationId, isTyping) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({type: isTyping ? 'typing' : 'stop_typing', conversationId}))
        }
    }, [])

    return {
        isConnected,
        messagesByConversation,
        typingByConversation,
        sendMessage,
        sendTyping
    }
}