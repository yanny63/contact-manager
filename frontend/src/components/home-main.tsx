import { useState, useEffect, useRef } from 'react';
import { getContacts, getChats, getMe, getChat } from '../ts/api';
import { formatPhoneNumber, formatPhoneNumberIntl } from 'react-phone-number-input';
import { span } from 'framer-motion/client';
import Skeleton from '../skeletons/skeleton';
import EmojiPicker, { EmojiStyle, Theme, EmojiClickData } from 'emoji-picker-react';

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

function Attachments() {
    return (
        <div className='attachment-container'>
            <div className='attachment-icon'>
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-paperclip">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M15 7l-6.5 6.5a1.5 1.5 0 0 0 3 3l6.5 -6.5a3 3 0 0 0 -6 -6l-6.5 6.5a4.5 4.5 0 0 0 9 9l6.5 -6.5" />
                </svg>
            </div>
        </div>
    )
}

function MessageInput({ message, setMessage }) {
    return (
        <input id='message' value={message} type='text' placeholder='Zacznij pisać...' onKeyDown={(a) => {
            if (a.currentTarget.value === 'Enter') {
                console.log('dziala cwelu')
            }
        }} onChange={(e) => {setMessage(e.target.value)}} />
    )
}

function SendButton({ message }: { message: string }) {
    return (
        <button className='send-button' disabled={!message.length}>
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

function Chat({ id, info, Avatar, message, setMessage, lightMode, emojisFocused, setEmojisFocused }) {
    const pickerRef = useRef<HTMLDivElement>(null)
    const cursorPosRef = useRef<number | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

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

        return () => {
            document.removeEventListener('mousedown', handleClick)
        }
    }, [emojisFocused])
    return (
        <div className='chat-open'>
            <div className='chat-header'>
                <Avatar name={info.nickname ? info.nickname : info.prefix} />
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
            <div className='chat-content'></div>
            <div className='chat-input'>
                <Attachments />
                <MessageInput message={message} setMessage={setMessage} />
                <Emojis lightMode={lightMode} emojisFocused={emojisFocused} setEmojisFocused={setEmojisFocused} pickerRef={pickerRef} handleClick={handleEmojiClick} />
                <SendButton message={message} />
            </div>
        </div>
    )
}

function Main({ numbers, setNumbers, Avatar, inputRef, setAsideClosed, lightMode }) { 

    interface ChatsInt {
        phone: string
        prefix: string
        nickname?: string
        picture?: string
        body?: string
        created_at?: string
        favourite: boolean
        conversation_id: number
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
    }, [])

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
                    <div className='chat'>
                        <Skeleton width='40px' height='40px' circle={true}/>
                        <div className='skeleton-name-msg'>
                            <Skeleton width='120px' height='20px' />
                            <Skeleton width='80px' height='20px' />
                        </div> 
                    </div>
                ))}
            </div>
        )
    }

    async function openChat(id: string) {
        try {
            const chat = await getChat(id)
            console.log(chat)
        } 
        catch (err) {
            if (err instanceof Error) {
                console.error(err.message)
            }
        }
        
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

    function DisplayChats() {
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
                    <div className='chat' onClick={() => {setCurrentlyOpen(numb.conversation_id), setChatOpen(true)}} key={numb.conversation_id}> 
                        <Avatar name={numb.nickname ? numb.nickname : numb.prefix }/>
                        <div className='central-chat-container'>
                            <span>{ numb.nickname ? formatName(numb.nickname) : formatNumber(numb.prefix, numb.phone)}</span>
                            <span className='last-message'>{ numb.body }</span>
                        </div>
                        <div className='created-at'>
                            <span>{ numb.created_at }</span>
                            <span>{/* Not read */}</span>
                        </div>
                    </div>
                )) : chats.map((numb) => (
                    <div className='chat' onClick={() => {setCurrentlyOpen(numb.conversation_id), 
                        setChatOpen(true),
                        setCurrentInfo({nickname: numb.nickname || null, phone: numb.phone, prefix: numb.prefix, picture: numb.picture || null, favourite: numb.favourite})}} 
                        key={numb.conversation_id}> 
                        <Avatar name={numb.nickname ? numb.nickname : numb.prefix }/>
                        <div className='central-chat-container'>
                            <span>{ numb.nickname ? formatName(numb.nickname) : formatNumber(numb.prefix, numb.phone)}</span>
                            <span className='last-message'>{ numb.body }</span>
                        </div>
                        <div className='created-at'>
                            <span>{ numb.created_at }</span>
                            <span>{/* Not read */}</span>
                        </div>
                    </div>
                )) 
                : currentlyDisplayed === 'fav' ? search ? chats.filter(n => n.nickname.toLowerCase().includes(search.toLowerCase())).filter(numb => numb.favourite).map((numb => (
                    <div className='chat' onClick={() => {setCurrentlyOpen(numb.conversation_id), 
                        setChatOpen(true),
                        setCurrentInfo({nickname: numb.nickname || null, phone: numb.phone, prefix: numb.prefix, picture: numb.picture || null, favourite: numb.favourite})}} 
                        key={numb.conversation_id}>
                        <Avatar name={numb.nickname ? numb.nickname : numb.prefix } />
                        <div className='central-chat-container'>
                            <span>{ numb.nickname ? formatName(numb.nickname) : formatNumber(numb.prefix, numb.phone)}</span>
                            <span className='last-message'>{ numb.body }</span>
                        </div>
                        <div className='created-at'>
                            <span>{ numb.created_at }</span>
                            <span>{/* Not read */}</span>
                        </div>
                    </div>
                    ))) :
                chats.filter(numb => numb.favourite).map((numb => (
                    <div className='chat' onClick={() => {setCurrentlyOpen(numb.conversation_id), 
                    setChatOpen(true),
                    setCurrentInfo({nickname: numb.nickname || null, phone: numb.phone, prefix: numb.prefix, picture: numb.picture || null, favourite: numb.favourite})}}
                    key={numb.conversation_id}>
                        <Avatar name={numb.nickname ? numb.nickname : numb.prefix } />
                        <div className='central-chat-container'>
                            <span>{ numb.nickname ? formatName(numb.nickname) : formatNumber(numb.prefix, numb.phone)}</span>
                            <span className='last-message'>{ numb.body }</span>
                        </div>
                        <div className='created-at'>
                            <span>{ numb.created_at }</span>
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
                    <Chat id={currentlyOpen} info={currentInfo} Avatar={Avatar} message={message} 
                    setMessage={setMessage} lightMode={lightMode} emojisFocused={emojisFocused} setEmojisFocused={setEmojisFocused} />
                ) : (
                    <ChatPlaceholder />
                )}
            </div>
        </div>
    )
}

export default Main