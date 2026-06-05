import { useState, useEffect } from 'react';
import { getContacts } from '../ts/api';
import { formatPhoneNumberIntl } from 'react-phone-number-input';
import { span } from 'framer-motion/client';

function Main({ numbers, setNumbers, Avatar }) { 

    const [ currentlyDisplayed, setCurrentlyDisplayed ] = useState('all')

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

    function DisplayChats() {
        console.log(numbers)
        return (
            <div className='chats-container'>
                { numbers === undefined ? 
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
                {/* <button onClick={async () => {
                    const res = await fetch("http://192.168.1.34:8000/API/chats", {
                        headers: {"Authorization": `Bearer ${localStorage.getItem('token')}`}
                    })
                    console.log(await res.json())
                }}> Pobierz </button> */}
            </div>
        </div>
    )
}

export default Main