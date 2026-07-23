import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { getContacts, getChats, getMe, getChat } from '../ts/api';
import { formatPhoneNumber, formatPhoneNumberIntl } from 'react-phone-number-input';
import { AnimatePresence, motion } from 'framer-motion';
import Skeleton from '../skeletons/skeleton';
import EmojiPicker, { EmojiStyle, Theme, EmojiClickData } from 'emoji-picker-react';
import { useUser } from '../contexts/context';
import { useChat } from '../contexts/chat'; 
import { IconDots, IconMoodSmile, IconShare3, IconDotsVertical, IconPaperclip } from '@tabler/icons-react';
import { useForceUpdate } from '../ts/utils';
import * as Dialog from '@radix-ui/react-dialog'

function SearchInput({ setSearch }) {
    return (
        <label htmlFor='search' className='search-input-container'>
            <div style={{ position: 'relative' }}>
                <input id='search' className='search-input' placeholder='' onChange={(e) => {setSearch(e.target.value)}} />
                <span className='search-input-placeholder'>Wyszukaj kontakt</span>
            </div>
        </label>
    )
}

interface AttachmentPreview {
    file: File
    previewUrl: string
    type: "image" | "video" | "other"
}

function Attachments({ fileInputRef, attachment, setAttachment }) {

    function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        const previewUrl = URL.createObjectURL(file)
        console.log(`GENERATED URL: ${previewUrl}`)

        const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "other"
        setAttachment({ file, previewUrl, type })
    }

    useEffect(() => {
        return () => {
            if (attachment) {
                URL.revokeObjectURL(attachment.previewUrl)
            }
        }
    }, [attachment])

    return (
        <div className='attachment-container'>
            <input ref={fileInputRef} onChange={handleFileInputChange} hidden
            type='file' accept='image/*, video/*, audio/*, application/pdf, .doc, .docx, .xls, .xlsx, .zip' />
            <div className='attachment-icon' onClick={() => {fileInputRef.current?.click()}}>
                <IconPaperclip stroke={2} />
            </div>
        </div>
    )
}

function MessageInput({ id, sendTyping, message, setMessage, trackCursor, buttonRef, timeoutRef }) {

    function handleEnter(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && !e.shiftKey && buttonRef.current) {
            buttonRef.current.click()
            clearTimeout(timeoutRef.current)
            sendTyping(id, false)
        }
    }
    const handleTyping = () => {
        sendTyping(id, true)

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = window.setTimeout(() => {
            sendTyping(id, false)
        }, 3000)
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value

        if (value === '') {
            clearTimeout(timeoutRef.current)
            sendTyping(id, false)
            return
        }

        handleTyping()
    }

    return (
        <input id='message' value={message} type='text' placeholder='Zacznij pisać...' onKeyUp={trackCursor} 
        onClick={trackCursor} 
        onChange={(e) => {
            setMessage(e.target.value);
            handleChange(e)
        }} 
        onKeyDown={handleEnter} />
    )
}

function SendButton( { message, attachment, setAttachment, setMessage, buttonRef, sendMessage, id, timeoutRef, sendTyping }) {

    function handleButtonClick() {
        if (!message.trim() && !attachment) return

        sendMessage(id, message)
        setMessage('')
        clearTimeout(timeoutRef.current)
        sendTyping(id, false)
    }

    return (
        <button ref={buttonRef} className='send-button' onClick={() => {handleButtonClick()}} disabled={!message.length}>
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-send">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 14l11 -11" />
                <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
            </svg>
        </button>
    )
}

function Emojis({ lightMode, emojisFocused, setEmojisFocused, pickerRef, handleClick }) {
    return (
        <div className='emoji-container'>
            <div className='emoji-button' onClick={() => setEmojisFocused(prev => !prev)}>
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-mood-smile">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                    <path d="M9 10l.01 0" />
                    <path d="M15 10l.01 0" />
                    <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
                </svg>
            </div>
            { pickerRef && (
                <div ref={pickerRef}>
                    <EmojiPicker onEmojiClick={handleClick} theme={lightMode ? Theme.LIGHT : Theme.DARK} emojiStyle={EmojiStyle.NATIVE} className={emojisFocused ? 'emojis-open' : 'emojis-closed'}/>
                </div>
            )}
        </div>
    )
}

function Chat({ id, info, Avatar, message, setMessage, lightMode, emojisFocused, setEmojisFocused, user }) {
    const pickerRef = useRef<HTMLDivElement>(null)
    const cursorPosRef = useRef<number | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const timeoutRef = useRef<number | null>(null)
    const bottomChatRef = useRef<HTMLDivElement | null>(null)

    const { messagesByConversation, typingByConversation, setConversationMessages, sendMessage, sendTyping } = useChat()

    function trackCursor() {
        if (inputRef.current) {
            cursorPosRef.current = inputRef.current.selectionStart
        }
    }

    function handleEmojiClick(emojiData: EmojiClickData) {
        const emoji = emojiData.emoji
        const cursorPos = cursorPosRef.current ?? message.length

        const before = message.slice(0, cursorPos)
        const after = message.slice(cursorPos)
        const newMessage = before + emoji + after

        setMessage(newMessage)

        const newCurPos = cursorPos + emoji.length
        cursorPosRef.current = newCurPos

        requestAnimationFrame(() => {
            inputRef.current?.focus()
            inputRef.current?.setSelectionRange(newCurPos, newCurPos)
        })
    }

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setEmojisFocused(false)
            }
        }
        if (emojisFocused) {
            document.addEventListener('mousedown', handleClick)
        }
        return () => document.removeEventListener('mousedown', handleClick)
    }, [emojisFocused])

    useEffect(() => {
        async function loadChat() {
            const data = await getChat(String(id))

            setConversationMessages(id, data)
        }
        loadChat()
    }, [id])

    const messages = messagesByConversation[id] ?? []
    const typing = typingByConversation[id] ?? new Set()
    const isTyping = typing.has(info.id)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [ attachment, setAttachment ] = useState<AttachmentPreview | null>(null)

    const handleCancel = () => {
        if (attachment) URL.revokeObjectURL(attachment.previewUrl)
        setAttachment(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    useEffect(() => {
        if (!bottomChatRef.current) return
        bottomChatRef.current?.scrollIntoView({
            behavior: 'smooth'
        })
    }, [messages])

    const [ messageHovered, setMessageHovered ] = useState<number | null>(null)
    const [ attachmentHovered, setAttachmentHovered ] = useState<boolean>(false)
    const [ previewOpen, setPreviewOpen ] = useState<boolean>(false)

    return (
        <div className='chat-open'>
            <div className='chat-header'>
                <Avatar user={info} />
                <div>
                    {info.nickname ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ textAlign: 'start' }}>{info.nickname}</span>
                            <span style={{ fontSize: '0.85rem' }}>
                                {formatPhoneNumberIntl(`+${info.prefix}${info.phone}`)}
                            </span>
                        </div>
                    ) : (
                        <span>{formatPhoneNumberIntl(`+${info.prefix}${info.phone}`)}</span>
                    )}
                </div>
            </div>
            <div className='chat-content'>
                { messages.map((message, i) => (
                    <div key={message.messageId ?? i} onMouseEnter={() => {setMessageHovered(message.messageId)}}
                    className={message.senderId === user.id ? 'message-container user' : 'message-container other'}>
                        <div className='message-avatar'>
                            { message.senderId === user.id ? 
                            <></> 
                            : info.picture ? <img src={info.picture} /> : <Avatar user={info} />}
                        </div>
                        <div className={message.senderId === user.id ? "message me" : "message others"}>
                            { message.text }
                        </div>
                        { messageHovered === message.messageId && 
                        <div className={message.senderId === user.id ? "message-management-me" : "message-management-others" }>
                            <IconMoodSmile stroke={2} />
                            <IconShare3 stroke={2} />
                            <IconDotsVertical stroke={2} />
                        </div>}
                    </div>
                ))}
                <AnimatePresence>
                    { isTyping && 
                    <motion.div 
                    className='typing-container'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    >
                        { info.picture ? <img src={info.picture} /> : <Avatar user={info} /> }
                        <div className='typing'>
                            <IconDots stroke={2} />
                        </div>
                    </motion.div>}
                </AnimatePresence>
                <div ref={bottomChatRef}></div>
            </div>
            <div className='chat-input'>
                { attachment && 
                <div className='chat-attachments' 
                onMouseEnter={() => (setAttachmentHovered(true))} 
                onMouseLeave={() => (setAttachmentHovered(false))}>
                    { attachmentHovered && <button className='attachment-remover' onClick={handleCancel}>X</button> }
                    { attachment.type === 'image' ? <img src={attachment.previewUrl} alt='podgląd' onClick={() => {setPreviewOpen(true)}} /> 
                    : attachment.type === 'video' ? <video src={attachment.previewUrl} controls onClick={() => {setPreviewOpen(true)}} /> :
                    <p>📎{attachment.file.name}</p>}
                </div>
                }
                <div className='inner-chat-input'>
                    <Attachments fileInputRef={fileInputRef} attachment={attachment} setAttachment={setAttachment} />
                    <MessageInput id={id} sendTyping={sendTyping} buttonRef={buttonRef} message={message} setMessage={setMessage} trackCursor={trackCursor} timeoutRef={timeoutRef} />
                    <Emojis lightMode={lightMode} emojisFocused={emojisFocused} setEmojisFocused={setEmojisFocused} pickerRef={pickerRef} handleClick={handleEmojiClick} />
                    <SendButton buttonRef={buttonRef} attachment={attachment} setAttachment={setAttachment} message={message} setMessage={setMessage} sendMessage={sendMessage} id={id} timeoutRef={timeoutRef} sendTyping={sendTyping} />
                </div>
            </div>
            { attachment &&
            <Dialog.Root open={previewOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className='preview-overlay' onClick={() => (setPreviewOpen(false))} />
                    <Dialog.Content className='preview-content-container'>
                        { attachment.type === 'image' ? <img src={attachment.previewUrl} alt='podgląd' /> : 
                        attachment.type === 'video' ? <video src={attachment.previewUrl} controls /> : <></> }
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root> }
        </div>
    )
}

function Main({ numbers, setNumbers, Avatar, inputRef, setAsideClosed, lightMode, asideVisible, setAsideVisible }) { 

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

    interface AvatarPerson {
        nickname: string | null;
        phone: string;
        prefix: string;
    }

    const [ search, setSearch ] = useState('')
    const [ currentlyDisplayed, setCurrentlyDisplayed ] = useState('all')
    const [ chats, setChats ] = useState<ChatsInt[]>([])
    const [ chatsLoaded, setChatsLoaded ] = useState(false)
    const [ currentlyOpen, setCurrentlyOpen ] = useState<null | number>(null)
    const [ currentInfo, setCurrentInfo ] = useState<object>({})
    const [ message , setMessage ] = useState<string>('')
    const [ chatOpen, setChatOpen ] = useState<boolean>(false)
    const [ emojisFocused, setEmojisFocused ] = useState<boolean>(false)

    interface User {
        id: number
        phone: string
        picture?: string
        prefix: string
    }
    const { user } : {user: User}= useUser()

    useEffect(() => {
        async function chatGetter() {
            try {
                const data = await getChats()
                setChats(data ?? [])
            } catch (err) {
                console.error(err)
                setChats([])
            } finally {
                setChatsLoaded(true)
            }
        }
        chatGetter()  
        setCurrentlyOpen(null)
    }, [user])

    const { messagesByConversation } = useChat()

    useEffect(() => {
        setChats((prev) => prev.map((chat) => {
            const msgs = messagesByConversation[chat.conversation_id]
            if (!msgs || msgs.length === 0) return chat

            const lastMsg = msgs[msgs.length - 1]
            return {
                ...chat,
                body: lastMsg.text,
                created_at: lastMsg.createdAt
            }
        }))
    }, [messagesByConversation])

    function Buttons() {
        return (
            <div className='tabs'>
                {['all', 'fav', 'unread'].map((tab) => (
                    <button
                        key={tab}
                        className="tab"
                        data-active={currentlyDisplayed === tab}
                        onClick={() => setCurrentlyDisplayed(tab)}
                    >
                        {tab === 'all' ? 'Wszystkie' : tab === 'fav' ? 'Ulubione' : 'Nieprzeczytane'}
                    </button>
                ))}
            </div>
        )
    }

    function formatName(name: string) {
        const parts = name.trim().split(" ")
        if (parts.length === 1) return parts[0]
        return `${parts[0]} ${parts.at(-1)[0]}.`
    }

    function formatNumber(prefix: string, phone: string) {
        const number = `+${prefix}${phone}`
        return formatPhoneNumberIntl(number)
    }

    function ChatSkeleton() {
        return (
            <div className='chats-container'>
                {Array(3).fill(0).map((_, i) => (
                    <div key={i} className='chat'>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Skeleton width='40px' height='40px' circle={true}/>
                            <div className='skeleton-name-msg'>
                                <Skeleton width='120px' height='20px' />
                                <Skeleton width='80px' height='20px' />
                            </div> 
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    function ChatPlaceholder() {
        return (
            <div className='chat-placeholder'>
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-message-circle">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1" />
                </svg>
                <p>Kliknij kontakt, aby otworzyć czat</p>
            </div>
        )
    }

    function ChatCloser() {
        return (
            <button onClick={() => setChatOpen(prev => !prev)} 
            className={chatOpen ? 'chat-closer' : 'chat-closer closed'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                </svg>
            </button>
        )
    }

    function formatTime(isotime: string) {
        const date = new Date(isotime)
        const now = new Date()

        const diffMs = now.getTime() - date.getTime()
        const diffSec = Math.floor(diffMs / 1000)
        const diffMin = Math.floor(diffSec / 60)
        const diffHour = Math.floor(diffMin / 60)
        const diffDay = Math.floor(diffHour / 24)

        if (diffSec < 60) return "przed chwilą"
        if (diffMin < 60) return `${diffMin} min temu`
        if (diffHour < 24) return `${diffHour} godz. temu`
        if (diffDay < 7) return `${diffDay} dni temu`

        return date.toLocaleTimeString([], { day: 'numeric', month: 'short' })
    }

    function DisplayChats() {

        useForceUpdate()

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
                
                currentlyDisplayed === 'all' ? search ? chats.filter(n => n.nickname.toLowerCase().includes(search.toLowerCase())).map((numb) => (
                    <div className='chat' onClick={() => {setCurrentlyOpen(numb.conversation_id)
                    setCurrentInfo({id: numb.id, nickname: numb.nickname || null, phone: numb.phone, prefix: numb.prefix, picture: numb.picture || null, favourite: numb.favourite}),
                     setChatOpen(true)}} key={numb.conversation_id}> 
                        <div className='inner-chat-container'>
                            <Avatar user={numb}/>
                            <div className='central-chat-container'>
                                <span>{ numb.nickname ? formatName(numb.nickname) : formatNumber(numb.prefix, numb.phone)}</span>
                                <span className='last-message'>{ numb.body.length > 40 ? `${numb.body.slice(0, 40)}...` : numb.body.slice(0, 40) }</span>
                            </div>
                        </div>
                        <div className='created-at'>
                            <span className='created-at-display'>{ formatTime(numb.created_at) }</span>
                            <span>{/* Not read */}</span>
                        </div>
                    </div>
                )) : chats.map((numb) => (
                    <div className='chat' onClick={() => {setCurrentlyOpen(numb.conversation_id), 
                        setChatOpen(true),
                        setCurrentInfo({id: numb.id, nickname: numb.nickname || null, phone: numb.phone, prefix: numb.prefix, picture: numb.picture || null, favourite: numb.favourite})}} 
                        key={numb.conversation_id}> 
                        <div className='inner-chat-container'>
                            <Avatar user={numb}/>
                            <div className='central-chat-container'>
                                <span>{ numb.nickname ? formatName(numb.nickname) : formatNumber(numb.prefix, numb.phone)}</span>
                                <span className='last-message'>{ numb.body.length > 40 ? `${numb.body.slice(0, 40)}...` : numb.body.slice(0, 40) }</span>
                            </div>
                        </div>
                        <div className='created-at'>
                            <span className='created-at-display'>{ formatTime(numb.created_at) }</span>
                            <span>{/* Not read */}</span>
                        </div>
                    </div>
                )) 
                : currentlyDisplayed === 'fav' ? search ? chats.filter(n => n.nickname.toLowerCase().includes(search.toLowerCase())).filter(numb => numb.favourite).map((numb => (
                    <div className='chat' onClick={() => {setCurrentlyOpen(numb.conversation_id), 
                        setChatOpen(true),
                        setCurrentInfo({id: numb.id, nickname: numb.nickname || null, phone: numb.phone, prefix: numb.prefix, picture: numb.picture || null, favourite: numb.favourite})}} 
                        key={numb.conversation_id}>
                        <div className='inner-chat-container'>
                            <Avatar user={numb}/>
                            <div className='central-chat-container'>
                                <span>{ numb.nickname ? formatName(numb.nickname) : formatNumber(numb.prefix, numb.phone)}</span>
                                <span className='last-message'>{ numb.body.length > 40 ? `${numb.body.slice(0, 40)}...` : numb.body.slice(0, 40) }</span>
                            </div>
                        </div>
                        <div className='created-at'>
                            <span className='created-at-display'>{ formatTime(numb.created_at) }</span>
                            <span>{/* Not read */}</span>
                        </div>
                    </div>
                    ))) :
                chats.filter(numb => numb.favourite).map((numb => (
                    <div className='chat' onClick={() => {setCurrentlyOpen(numb.conversation_id), 
                    setChatOpen(true),
                    setCurrentInfo({nickname: numb.nickname || null, phone: numb.phone, prefix: numb.prefix, picture: numb.picture || null, favourite: numb.favourite})}}
                    key={numb.conversation_id}>
                        <div className='inner-chat-container'>
                            <Avatar user={numb}/>
                            <div className='central-chat-container'>
                                <span>{ numb.nickname ? formatName(numb.nickname) : formatNumber(numb.prefix, numb.phone)}</span>
                                <span className='last-message'>{ numb.body }</span>
                            </div>
                        </div>
                        <div className='created-at'>
                            <span className='created-at-display'>{ formatTime(numb.created_at) }</span>
                            <span>{/* Not read */}</span>
                        </div>
                    </div>
                    )))
                : <span></span>
                // : {numbers.map()}

                }
            </div>
        )
    }

    return (
        <div className="home-article">
            <div className="article-isNav">
                { chats.length > 0 && <div className='article-nav-buttons-container'>
                    <Buttons />
                </div>}
                { chats.length > 0 && <SearchInput setSearch={setSearch}/>}
                <DisplayChats />    
            </div>
            <ChatCloser />
            <div className={chatOpen ? 'chat-container' : 'chat-container chat-not-visible'}>
                {currentlyOpen ? (
                    user?.id && <Chat id={currentlyOpen} info={currentInfo} Avatar={Avatar} message={message} 
                    setMessage={setMessage} lightMode={lightMode} emojisFocused={emojisFocused} setEmojisFocused={setEmojisFocused} user={user} /> 
                ) : (
                    <ChatPlaceholder />
                )}
            </div>
        </div>
    )
}

export default Main