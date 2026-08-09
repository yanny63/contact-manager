import { memo } from 'react'
import { formatName, formatNumber, formatTime, Avatar } from './utils'
import { IconDots } from '@tabler/icons-react'
import { useForceUpdate } from './utils'

interface ChatsInt {
    id: string
    phone: string
    prefix: string
    nickname?: string
    picture?: string
    body?: string
    created_at?: string
    favourite: boolean
    conversation_id: number
}
interface ChatItemInt {
    chat: ChatsInt
    isTyping: boolean
    onClick: (chat: ChatsInt) => void
}

export const ChatItem = memo(function ChatItem({ chat, isTyping, onClick }: ChatItemInt) {
    console.log('CHAT ITEM RENDER', chat.id, isTyping)
    return (
        <div className='chats-container'>
            <div className='chat' onClick={() => {onClick(chat)}}  key={chat.conversation_id}> 
                <div className='inner-chat-container'>
                    <Avatar user={{ nickname: chat.nickname, phone: chat.phone, prefix: chat.prefix}}/>
                    <div className='central-chat-container'>
                        <span>{ chat.nickname ? formatName(chat.nickname) : formatNumber(chat.prefix, chat.phone)}</span>
                        { isTyping ? 
                        <span className='chat-typing'>
                            <IconDots stroke={2} width={40} height={22} />
                        </span>
                        : <span className='last-message'>{ chat.body.length > 40 ? `${chat.body.slice(0, 40)}...` : chat.body.slice(0, 40) }</span>}
                    </div>
                </div>
                <div className='created-at'>
                    <span className='created-at-display'>{ formatTime(chat.created_at) }</span>
                    <span>{/* Not read */}</span>
                </div>
            </div>
        </div>
    )
})

export function DisplayChats({ chats, currentlyDisplayed, search, ChatSkeleton, handleOpenChat, chatsLoaded, inputRef, typingByConversation, setAsideClosed }) {

    useForceUpdate()

    let displayedChats = chats

    if (currentlyDisplayed === 'fav') {
        displayedChats = displayedChats.filter(chat => chat.favourite)
    }
    // if (currentlyDisplayed === 'unread') {
    //     displayedChats = displayedChats.filter(chat => chat.)
    // }
    if (search) {
        displayedChats = displayedChats.filter(chat => 
            chat.nickname ? 
            chat.nickname?.toLowerCase().includes(search.toLowerCase()) 
            : chat.phone?.includes(search)
        )
    }
    console.log('DISPLAY CHATS RENDER')
    return (
        <div className='chats-container'>
            { !chatsLoaded ? 
            <ChatSkeleton />
            : chats === undefined || chats.length === 0 ? 
            <div className='no-chats'>
                <div className='no-chats-icon'>
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-messages">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M21 14l-3 -3h-7a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1h9a1 1 0 0 1 1 1v10" />
                        <path d="M14 15v2a1 1 0 0 1 -1 1h-7l-3 3v-10a1 1 0 0 1 1 -1h2" />
                    </svg>
                </div>
                <h3>Brak rozmów</h3>
                <p>Dodaj pierwszy kontakt i zacznij pisać</p>
                <button onClick={() => {inputRef.current?.focus(), setAsideClosed(false)}}>Nowy Kontakt</button>
            </div> : 
            displayedChats.map(chat => (
                <ChatItem key={chat.conversation_id}
                chat={ chat } 
                isTyping={ typingByConversation[chat.conversation_id]?.has(chat.id) ?? false }
                onClick={handleOpenChat}
                />
            ))
        }
        </div>
    )
}