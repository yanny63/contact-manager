import React, { useState, useEffect, useRef, KeyboardEvent } from "react"
import PhoneInput from 'react-phone-number-input'
import { parsePhoneNumber } from "react-phone-number-input"
import 'react-phone-number-input/style.css'
import { newContact, getContacts, favToggle } from "../ts/api"
import * as Dialog from "@radix-ui/react-dialog"
import { Link } from "react-router-dom"
import { useUser } from "../contexts/context"

function NotLoggedInOverlay({ popupVisible, setPopupVisible, phone, setPhone }) {

    const [ loginFormPassword, setLoginFormPassword ] = useState('')
    const [ loginError, setLoginError ] = useState(false)
    const  buttonRef = useRef<HTMLButtonElement>(null)

    const { login } = useUser()
    
    async function handleSubmit() {
        if (!phone || !loginFormPassword) {
            setLoginError(true)
            return
        }

        const parsed = parsePhoneNumber(phone)

        const data = await login(parsed.nationalNumber, parsed.countryCallingCode, loginFormPassword)
        if (data) {
            setPopupVisible(false)
        }
        setLoginError(false)
    }

    function handleClose() {
        setPopupVisible(false)
        setLoginError(false)
    }

    function handleEnter(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            buttonRef.current.click()
        }
    }

    return (
        <Dialog.Root open={popupVisible}>
            <Dialog.Portal>
                <Dialog.Overlay className="not-logged-overlay" onClick={handleClose} />
                <Dialog.Content className="not-logged-content">
                    <Dialog.Title>Zaloguj się</Dialog.Title>
                    <div className="not-logged-inner">
                        <PhoneInput 
                        international
                        defaultCountry="PL"
                        value={phone}
                        onChange={setPhone}/>
                    </div>
                    
                    <div className="not-logged-inner">
                        <label htmlFor="password">Hasło</label>
                        <input value={loginFormPassword} 
                        onChange={(e) => {setLoginFormPassword(e.target.value)}}
                        onKeyDown={handleEnter}
                        className="form-input" id="password" type="password" placeholder="••••••••••••"/>
                    </div>

                    <button  ref={buttonRef} className="form-button" onClick={() => {handleSubmit()}}>Zaloguj się</button>
                    { loginError && <p className="not-logged-error">Nieprawidłowy numer lub hasło</p> }
                    <div className="not-logged-bottom">
                        <Link to={"/forgotpassword"}>Zapomniałeś hasła?</Link>
                        <Link to={'/auth/register'}>Zarejestruj się</Link>
                    </div>

                    <Dialog.Close className="not-logged-overlay-closer" asChild onClick={handleClose}>
                        <button>X</button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

function Aside({ search, setSearch, onError, checkToken, numbers, setNumbers, Avatar, inputRef }) {

    interface NumberType {
        id: number
        phone: string
        prefix: string
        nickname: string
        avatar?: string 
        favourite: boolean
    }

    const [ phone, setPhone ] = useState('')
    const [ popupVisible, setPopupVisible ] = useState(false)
    const [ value, setValue ] = useState('')
    const [ newContactError, setNewContactError ] = useState(false)
    const [ favError, setFavError ] = useState(false)
    const [ displayFavourites, setDisplayFavourite ] = useState(true)

    const { user } = useUser()

    useEffect(() => {
        const contactsGetter = async () => {
            const numbersFromBackend  = await getContacts() as NumberType[]
            setNumbers(numbersFromBackend)
        }
        contactsGetter()
    }, [user])

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
        error: string
        status: number
    }

    interface ReturningContact {
        phone: string
        prefix: string
        nickname: string
        id: number
        favourite?: boolean
    }

    async function addContact(e: React.FormEvent<HTMLFormElement>) {
        try {
            e.preventDefault()
            if (!localStorage.getItem('token') || localStorage.getItem('token') == '') {
                setPopupVisible(true)
                return
            }

            const form = e.currentTarget

            const data = new FormData(e.currentTarget)
            const contact = Object.fromEntries(data) as any
            const parsed = parsePhoneNumber(value)
            contact['phone'] = parsed.nationalNumber
            contact['prefix'] = parsed.countryCallingCode
            contact['favourite'] = data.get('favourite') === 'on'
            const backendId : ReturningContact = await newContact(contact)
            if (!backendId) {
                setNewContactError(true)
                return
            }
            contact['id'] = backendId?.id
            console.log(contact)
            setNumbers([...numbers, contact])
            setNewContactError(false)
            form.reset()
            setValue('')
        }
        catch {
            setNewContactError(true)
        }
    }
    
    async function toggleFav(id: number, type: string) {
        if (type === 'favourites') {
            // unfav a contact
            const isOk = await favToggle(id, false)
            if (!isOk) {
                setFavError(true)
                return
            }
            setNumbers(prev => prev.map(item => item.id === id ? { ...item, favourite: !item.favourite } : item))
            setFavError(false)
            console.log("XD")
            console.log(numbers)
        }
        else {
            // add a contact to favs
            const isOk = await favToggle(id, true) 
            if (!isOk) {
                setFavError(true)
                return
            }
            setNumbers(prev => prev.map(item => item.id === id ? { ...item, favourite: !item.favourite } : item))
            setFavError(false)
            console.log('xd')
            console.log(numbers)
        }
    }

    // favourites display
    function Favourites() {
        if (!numbers || numbers[0] === null || numbers.length === 0) {
            return
        }

        return (
            <ul className="numbersList">
                { displayFavourites ? 
                    numbers.filter(numb => numb.favourite).map((fav) => (
                        <li className="isNumbersElement" key={fav.id}>
                            <div className="fav_image">
                                { fav.avatar ? <img src={fav.avatar} className="" /> : <Avatar name={fav.nickname ? fav.nickname : fav.phone} />}
                            </div>
                            <span className="liListElement">{fav.nickname ? fav.nickname.slice(0, 30) : `+${fav.prefix} ${fav.phone}`}</span>
                            <Star active={fav.favourite} onClick={() => toggleFav(fav.id, "favourites")}></Star> 
                        </li>
                    ))
                    : numbers.map((number) => (
                        <li className="isNumbersElement" key={number.id}>
                            <div className="fav_image">
                                { number.avatar ? <img src={number.avatar} className="" /> : <Avatar name={number.nickname ? number.nickname : number.phone} /> }
                            </div>
                            <span className="liListElement">{number.nickname ? number.nickname.slice(0, 30) : `+${number.prefix} ${number.phone}`}</span>
                            <Star active={number.favourite} onClick={() => toggleFav(number.id, number.favourite ? "favourites" : "not")}></Star>
                        </li>
                    ))
                }
            </ul>
        )
    }


    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
            <form className='add-contact-form' onSubmit={addContact}>
                <h3>Nowy Kontakt</h3>
                <PhoneInput 
                    numberInputProps={{className: newContactError ? 'contactError' : ''}}
                    international
                    defaultCountry='PL'
                    value={value}
                    onChange={setValue}
                    ref={inputRef}
                />
                <input className='form-input' name='nickname' placeholder='Pseudonim (opcjonalne)' type='text'/>
                <input type="checkbox" name="favourite" hidden id="favourite" />
                <label htmlFor="favourite" className="isFakeInput">
                    <span className="isCircle"></span>
                    <span>Ulubiony</span>
                </label>
                <button className='form-button'>Dodaj</button>
                { newContactError && <p className="contact-error">Nieprawidłowy numer telefonu</p>}
            </form>
            <div className="line"></div>
            <div className="favourites-container">
                <div className="fav-buttons-container">
                    <button className={ !displayFavourites ? "favButton active" : "favButton"} onClick={() => {setDisplayFavourite(false)}}>Wszystkie</button>
                    <button className={ displayFavourites ? "favButton active" : "favButton"} onClick={() => {setDisplayFavourite(true)}}>Ulubione</button>
                </div>
                <Favourites></Favourites>
            </div>
            <NotLoggedInOverlay popupVisible={popupVisible} setPopupVisible={setPopupVisible} phone={phone} setPhone={setPhone} /> 
        </div>
    )
}

export default Aside