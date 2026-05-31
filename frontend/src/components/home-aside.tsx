import { useState, useEffect, forwardRef } from "react"
import PhoneInput from 'react-phone-number-input'
import { parsePhoneNumber } from "react-phone-number-input"
import 'react-phone-number-input/style.css'
import { newContact, getContacts, unfavourite } from "../ts/api"

function Aside({ search, setSearch, onError, checkToken, numbers, setNumbers, Avatar }) {

    interface NumberType {
        id: number
        phone: string
        prefix: string
        nickname: string
        avatar?: string 
        favourite: boolean
    }

    const [ value, setValue ] = useState('')
    const [ favourites, setFavourites ] = useState([])
    const [ newContactError, setNewContactError ] = useState(false)
    const [ favError, setFavError ] = useState(false)

    useEffect(() => {
        const contactsGetter = async () => {
            const numbersFromBackend  = await getContacts() as NumberType[]
            setNumbers(numbersFromBackend)
        }
        contactsGetter()
    }, [setNumbers])

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

    interface resError {
        error: string,
        status: number
    }

    async function addContact(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        const form = e.currentTarget

        const data = new FormData(e.currentTarget)
        const contact = Object.fromEntries(data) as any
        const parsed = parsePhoneNumber(value)
        contact['phone'] = parsed.nationalNumber
        contact['prefix'] = parsed.countryCallingCode
        contact['favourite'] = data.get('favourite') === 'on'
        console.log(contact)
        if (await newContact(contact)) {
            setNumbers([...numbers, contact])
            setNewContactError(false)
            form.reset()
            setValue('')
        }
        else {
            setNewContactError(true)
        }
    }

    async function unfav(id: number) {
        const isOk = await unfavourite(id)
        if (!isOk) {
            setFavError(true)
            return
        }
        setFavourites(prev => prev.filter(number => number.id !== id ))
        setFavError(false)
    }
    
    async function toggleFav(id: number, type: string) {
        if (type === 'favourites') {
            await unfav(id)
        }
    }

    function Favourites() {
        if (!numbers || numbers[0] === null || numbers.length === 0) {
            return
        }
        const favs = numbers.filter(n => n.favourite)
        return (
            <ul className="numbersList">
                { favs.map((fav) => (
                    <li className="isNumbersElement" key={fav.id}>
                        <div className="fav_image">
                            { fav.avatar ? <img src={fav.avatar} className="" /> : <Avatar name={fav.nickname ? fav.nickname : fav.phone} />}
                        </div>
                        <span className="liListElement">{fav.nickname ? fav.nickname.slice(0, 30) : `+${fav.prefix} ${fav.phone}`}</span>
                        <Star active={fav.favourite} onClick={() => toggleFav(fav.id, "favourites")}></Star> 
                    </li>
                ))}
            </ul>
        )
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
                <input className='form-input' name='nickname' placeholder='Pseudonim (opcjonalne)' type='text'/>
                <input type="checkbox" name="favourite" hidden id="favourite" />
                <label htmlFor="favourite" className="isFakeInput">
                    <span className="isCircle"></span>
                    <span>Ulubiony</span>
                </label>
                <button className='form-button'>Dodaj</button>
            </form>
            <div className="line"></div>
            <div className="favourites-container">
                <h3>Ulubione</h3>
                <Favourites></Favourites>
            </div>
        </div>
    )
}

export default Aside