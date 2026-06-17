import { useState, useEffect, useRef } from 'react';
import { getContacts, getChats, getMe, getChat } from '../ts/api';
import { formatPhoneNumberIntl } from 'react-phone-number-input';
import { span } from 'framer-motion/client';
import Skeleton from '../skeletons/skeleton';

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

function Main({ numbers, setNumbers, Avatar, inputRef }) { 

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

    useEffect(() => {
        async function chatGetter() {
            const data : ChatsInt[] = await getChats() 
            console.log(data)
            setChats(data)
            setChatsLoaded(true)
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

    function Chat() {

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
                    <button className='' onClick={() => inputRef.current?.focus()}>Nowy Kontakt</button>
                </div> : // DOKONCZYC DIVA GDY NIE MA NUMEROW
                
                currentlyDisplayed === 'all' ? search ? chats.filter(n => n.nickname.toLowerCase().includes(search.toLowerCase())).map((numb) => (
                    <div className='chat' key={numb.conversation_id}> 
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
                    <div className='chat' key={numb.conversation_id}> 
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
                    <div className='chat' key={numb.conversation_id}>
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
                    <div className='chat' key={numb.conversation_id}>
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
                <div className='article-nav-buttons-container'>
                    <Buttons />
                </div>
                <SearchInput setSearch={setSearch}/>
                <DisplayChats />    
            </div>
            <div className='chats-container'>

            </div>
        </div>
    )
}

export default Main