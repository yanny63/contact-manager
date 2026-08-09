import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
    type: string
    conversationId: string
    senderId: string
    messageId?: string
    text?: string
    createdAt?: string
    editedAt?: string
}

export function useSocket(token) {

    const [ isConnected, setIsConnected ] = useState<boolean>(false)
    const [ messagesByConversation, setMessagesByConversation ] = useState({})
    const [ typingByConversation, setTypingByConversation ] = useState({})

    const ws = useRef<WebSocket>(null)

    useEffect(() => {
        
        if (!token) return
        
        ws.current = new WebSocket(`ws://192.168.0.126:8000/ws/chat?token=${token}`)

        ws.current.onopen = () => {
            setIsConnected(true)
            console.log('Websocket connected')
        }

        ws.current.onmessage = (event) => {
            const data : WebSocketMessage = JSON.parse(event.data)
            const { conversationId, type, senderId } = data

            if (type === "message") {
                setMessagesByConversation((prev) => ({
                    ...prev, [conversationId]: [...(prev[conversationId] ?? []), data]
                }))
            }

            if (type === "edit_message") {
                setMessagesByConversation((prev) => ({
                    ...prev, [conversationId]: (prev[conversationId] ?? []).map((msg) => (
                        msg.messageId === data.messageId ? { ...msg, text: data.text, editedAt: data.editedAt} : msg
                    ))
                }))
            }

            if (type === 'delete_message') {
                setMessagesByConversation((prev) => ({
                    ...prev, [conversationId]: (prev[conversationId] ?? []).map((msg) => (
                        msg.messageId === data.messageId ? { ...msg, deleted: true } : msg
                    ))
                }))
            }

            if (type === "typing") {
                setTypingByConversation((prev) => {
                    const set = new Set(prev[conversationId] ?? [])
                    set.add(senderId)
                    return { ...prev, [conversationId]: set }
                })
            }

            if (type === "stop_typing") {
                setTypingByConversation((prev) => {
                    const set = new Set(prev[conversationId] ?? [])
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

    const sendMessage = (conversationId, text) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: "message", conversationId, text}))
        }
    }

    const sendTyping = (conversationId, isTyping) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({type: isTyping ? 'typing' : 'stop_typing', conversationId}))
        }
    }

    const editMessage = (conversationId, messageId, text) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: "edit_message", conversationId, messageId, text }))
        }
    }

    const deleteMessage = (conversationId, messageId, senderId) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: "delete_message" , conversationId, messageId, senderId }))
        }
    }

    const setConversationMessages  = (conversationId, messages) => {
        setMessagesByConversation(prev => ({...prev, [conversationId]: messages}))
    }

    const prependConversationMessages = (conversationId, olderMessages) => {
        setMessagesByConversation(prev => ({
            ...prev,
            [conversationId]: [
                ...olderMessages,
                ...(prev[conversationId] ?? [])
            ]
        }))
    }

    return {
        isConnected,
        messagesByConversation,
        typingByConversation,
        setConversationMessages,
        sendMessage,
        sendTyping,
        deleteMessage,
        editMessage,
        prependConversationMessages
    }
}