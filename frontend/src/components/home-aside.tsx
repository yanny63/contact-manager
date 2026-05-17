import { useState, useEffect } from "react"
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { newContact, getContacts } from "../ts/api"

function Aside({ search, setSearch, onError, checkToken }) {
    const [ numbers, setNumbers ] = useState([])
    const [ value, setValue ] = useState('')

    useEffect(() => {
        getContacts()
    }, [])

    function removeContact(id: number) {
        setNumbers(n => n.filter(number => number.id !== id)
    )}

    function toggleFav(id) {
        setNumbers(numb =>
            numb.map(item => 
              item.id === id ? {...item, fav: !item.fav}
              : item
            )
        )
    }

    const filteredNumbers = numbers.filter(n => 
        n.phone.includes(search) || 
        n.nickname.includes(search)
    ).sort((a, b) => b.fav - a.fav)

    function hideError(e) {
        e.target.remove()
    }

    function Star({active, onClick}) {
        return (
            <svg
            onClick={onClick}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={active ? "gold" : "none"}
            stroke="gold"
            strokeWidth="2"
            style={{ width: "18px", cursor: "pointer" }}>
            <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9" />
            </svg>
        )
    }

    const colors = [
        "#4F6EF7", "#E05A5A", "#2AAA8A", "#D4823A",
        "#9B59B6", "#1A7FC1", "#27AE60", "#C0392B",
    ]

    function getInitials(name) {
        const parts = name.trim().split(" ")
        if (parts[0].startsWith("+")) return "#"
        if (parts.length === 1) return parts[0][0].toUpperCase()
        return (parts[0][0] + parts.at(-1)[0]).toUpperCase()
    }

    function getColor(name) {
        let hash = 0
        for (const c of name) hash = (hash * 31 + c.CharCodeAt(0)) & 0xffff
        return colors[hash % colors.length]
    }

    function Avatar({ name, size = 40}) {
        return (
            <div style={{
                width: size, height: size, borderRadius: "50%",
                background: getColor(name),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: size * 0.35, fontWeight: 500, color: "#fff",
            }}>
                {getInitials(name)}
            </div>
        )
    }

    interface resError {
        error: string,
        status: number
    }

    function addContact(e) {
        const data = new FormData(e.target)
        const contact = Object.fromEntries(data) as any
        contact['favourite'] = false
        if (newContact(contact)) {

        }
        else {

        }
    }

    const [ favourites, setFavourites ] = useState([])

    async function getFavourites() {
        try {
            const res = await fetch('', {
                headers: {'Content-Type': 'application/json', 
                    'Authorizatiom': `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (!res.ok) {
                const data : resError = await res.json()
                throw new Error(data.error || `Błąd serwera ${data.status}`)
            }
            const data = await res.json() // Dokonczyc aside
        }
        catch (err) {
            onError(err)
        }
    }



    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
            <form className='add-contact-form' onSubmit={addContact}>
                <h3>Nowy Kontakt</h3>
                <PhoneInput 
                    international
                    defaultCountry='PL'
                    value={value}
                    onChange={setValue}
                />
                {/* <input className='form-input' name='phone' placeholder='Numer telefonu' type='number'/> */}
                <input className='form-input' name='nickname' placeholder='Pseudonim (opcjonalne)' type='text'/>
                <button className='form-button'>Dodaj</button>
            </form>
            <div className="line"></div>
            <div className="favourites-container">
                <h3>Ulubione</h3>
                {numbers.filter(numb => numb.fav).map((n) => 
                    <div key={n.id} className="favourite">
                        <div className="fav_image">
                            { n.avatar ? <img src={n.avatar} alt='Avatar'/> : <Avatar name={n.nickname ?? ''}></Avatar>}
                        </div>
                        <div className="fav_info">

                        </div>
                    </div>
                )}
            </div>

            
            {/* <div className='saved-numbers-container'>
                
                <ul className='numbersList'>
                {filteredNumbers.map((number) => (
                    <li className='isNumbersElement' key={number.id}>
                    <span className='liListElement'>{ number.nickname ? number.nickname : number.name + " " + number.surname}  - {number.phone}</span>
                    <button className='listButton' onClick={() => {removeContact(number.id)}}>Usuń</button>
                    <Star active={number.fav} onClick={() => toggleFav(number.id)}></Star>  
                    </li>
                ))}
                </ul>
            </div> */}

            {/* <div className='error-container'>
                { error.map((err) => 
                <div key={err.id} onClick={(e) => {hideError(e)}} >{err.err}</div>
                
                )}
            </div> */}
        </div>
    )
}

export default Aside