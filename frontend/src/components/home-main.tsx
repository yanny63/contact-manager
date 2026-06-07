import { useState, useEffect } from 'react';
import { getContacts, getChats, getMe } from '../ts/api';
import { formatPhoneNumberIntl } from 'react-phone-number-input';
import { span } from 'framer-motion/client';
import Skeleton from '../skeletons/skeleton';

function Main({ numbers, setNumbers, Avatar }) { 

    const [ currentlyDisplayed, setCurrentlyDisplayed ] = useState('all')
    const [ chats, setChats ] = useState([])
    const [ chatsLoaded, setChatsLoaded ] = useState(false)

    useEffect(() => {
        async function chatGetter() {
            const data = await getChats() 
            setChats([...chats, data])
        }
        chatGetter()  
        setChatsLoaded(true)
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
    


    function DisplayChats() {
        console.log(numbers)
        return (
            <div className='chats-container'>
                { !chatsLoaded ? 
                <ChatSkeleton />
                : chats === undefined || chats.length === 0 ? 
                <div>Nie ma </div> : // DOKONCZYC DIVA GDY NIE MA NUMEROW
                
                currentlyDisplayed === 'all' ? numbers.map((numb) => (
                    <div className='chat' key={numb.id}> 
                        <Avatar name={numb.nickname ? numb.nickname : numb.prefix }/>
                        <div className='central-chat-container'>
                            <span>{ numb.nickname ? formatName(numb.nickname) : formatNumber(numb.prefix, numb.phone)}</span>
                            <span></span>
                        </div>
                    </div>
                )) 
                : currentlyDisplayed === 'fav' ? numbers.filter(numb => numb.favourite).map((numb => (
                    <div className='chat' key={numb.id}>
                        <Avatar name={numb.nickname ? numb.nickname : numb.prefix } />
                        <div className='central-chat-container'>
                            <span>{ numb.nickname ? formatName(numb.nickname) : formatNumber(numb.prefix, numb.phone)}</span>
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
                <DisplayChats />    
                <button onClick={async () => {
                    // const res = await fetch("http://192.168.1.101:8000/API/chats", {
                    //     headers: {"Authorization": `Bearer ${localStorage.getItem('token')}`}
                    // })
                    // console.log(await res.json())
                    console.log(chats)
                }}> Pobierz </button>
            </div>
        </div>
    )
}

export default Main