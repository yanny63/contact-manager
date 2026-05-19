import { useState, useEffect, forwardRef } from "react"
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { newContact, getContacts, unfavourite } from "../ts/api"

function Aside({ search, setSearch, onError, checkToken }) {

    interface NumberType {
        id: number
        phone: string
        prefix: string
        nickname: string
        avatar?: string 
        favourite: boolean
    }

    const [ numbers, setNumbers ] = useState<NumberType[]>([])
    const [ value, setValue ] = useState('')
    const [ favourites, setFavourites ] = useState([])
    const [ newContactError, setNewContactError ] = useState(false)
    const [ favError, setFavError ] = useState(false)

    useEffect(() => {
        getContacts()
    }, [])

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

    async function addContact(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        const contact = Object.fromEntries(data) as any
        contact['favourite'] = false
        if (await newContact(contact)) {
            setNumbers([...numbers, contact])
            e.currentTarget.reset()
            setNewContactError(false)
        }
        else {
            setNewContactError(true)
        }
    }

    async function unfav(id: number) {
        const isOk = await unfavourite(id)
        if (!isOk) {
            setFavError(true)
        }
    }
    // DOKONCZYC OBIE FUNKCJE I ERRORY
    async function toggleFav(id: number) {

    }

    function Favourites() {
        const favs = numbers.filter(n => n.favourite)
        return (
            <ul className="numbersList">
                { favs.map((fav) => (
                    <li className="isNumbersElement" key={fav.id}>
                        <span className="liListElement">{fav.nickname ? fav.nickname : `+${fav.prefix} ${fav.phone}`}</span>
                        <button className="listButton" onClick={() => unfav(fav.id)}></button>
                        <Star active={fav.favourite} onClick={() => toggleFav(fav.id)}></Star> 
                    </li>
                ))}
            </ul>
        )
    }

    const phoneInnerInput = forwardRef(({ className, ...props }: any, ref) => (
        <input className={newContactError ? 'PhoneInputInput contactError' : 'PhoneInputInput'} {...props} ref={ref} />
    ))

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
            <form className='add-contact-form' onSubmit={addContact}>
                <h3>Nowy Kontakt</h3>
                <PhoneInput 
                    international
                    defaultCountry='PL'
                    value={value}
                    onChange={setValue}
                    inputComponent={phoneInnerInput}
                />
                <input className='form-input' name='nickname' placeholder='Pseudonim (opcjonalne)' type='text'/>
                <button className='form-button'>Dodaj</button>
            </form>
            <div className="line"></div>
            <div className="favourites-container">
                <h3>Ulubione</h3>
                {numbers.filter(numb => numb.favourite).map((n) => 
                    <div key={n.id} className="favourite">
                        <div className="fav_image">
                            { n.avatar ? <img src={n.avatar} alt='Avatar'/> : <Avatar name={n.nickname ?? ''}></Avatar>}
                        </div>
                        <div className="fav_info">

                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Aside