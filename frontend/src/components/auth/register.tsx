import { useState, useEffect } from 'react'
import { useUser } from '../../contexts/context'
import PhoneInput from 'react-phone-number-input'
import { parsePhoneNumber } from 'react-phone-number-input'
import { register } from '../../ts/api'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

function Register({ lightMode }) {

    const [ mainLoaded, setMainLoaded ] = useState(false)
    const [ elementsLoaded, setElementsLoaded ] = useState(false)
    const [ registerError, setRegisterError ] = useState(false)
    const [ value, setValue ] = useState('')

    const navigator = useNavigate()

    useEffect(() => {
        setMainLoaded(true)
        setTimeout(() => {
            setElementsLoaded(true)
        }, 400);
    }, [])

    interface Register {
        phone: string
        prefix: string
        password: string
    }

    async function reg(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        try {
            const data = new FormData(e.currentTarget)
            const Form = Object.fromEntries(data)
            const parsed = parsePhoneNumber(value)
            const validator = {
                phone: parsed.nationalNumber,
                prefix: parsed.countryCallingCode,
                password: Form.password as string
            }
            if (await register(validator.phone, validator.prefix, validator.password) === false) return
            navigator('/')
        }    
        catch (err) {
            console.log(err)
        }
    }

    function StarLogo(lightMode) {
        return (
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                <path 
                    d="M12 2L15 9H22L16.5 13.5L18.5 21L12 16.5L5.5 21L7.5 13.5L2 9H9L12 2Z" 
                />
            </svg>
        )
    }

    return (
        <div className={mainLoaded ? "register-main" : "register-main main-not-loaded"}>
            <div className='register-form-container'>
                <div>
                    <h1 style={{ transition: "0.6s" }} className={elementsLoaded ? "" : "content-not-loaded-left element-not-loaded-opacity"}>Zarejestruj się</h1>
                    <p style={{ transition: "0.6s" }} className={elementsLoaded ? "" : "content-not-loaded-right element-not-loaded-opacity"}>Stwórz swoje konto Linkr</p>
                </div>
                <div className="isLine"></div>
                <form onSubmit={reg} className={ elementsLoaded ? "login-form" : "login-form element-not-loaded-opacity" }>
                    <div className="login-form-inner-container">
                        <PhoneInput 
                            international 
                            defaultCountry='PL'
                            value={value}
                            onChange={setValue}
                        />
                    </div>
                    <div className="login-form-inner-container">
                        <label htmlFor="password">Hasło</label>
                        <input className="form-input" name='password' type="password" id='password' placeholder='••••••••••••' />
                    </div>
                    <button className="form-button">Zarejestruj się</button>
                </form>
                <div className={elementsLoaded ? "auth-bottom-text" : "auth-bottom-text element-not-loaded-opacity"}>
                    <p>Masz już konto?</p>
                    <Link to={'/auth/login'} className='auth-link'>Zaloguj się</Link>
                </div>
            </div>
            <div className="login-form-outer-container">
                <div className={ mainLoaded ? "login-inner-container-left isGradient" : "login-inner-container-left isGradient element-not-loaded-opacity" }>
                    <div style={{ transition: "1s" }} className={ elementsLoaded ? "login-inner-container-logo" : "login-inner-container-logo element-not-loaded-opacity"}> 
                        <StarLogo lightMode={lightMode}></StarLogo>
                    </div>
                    <div className="login-inner-container-isElement">
                        <h2 style={{ transition: "0.6s" }} className={elementsLoaded ? "" : "content-not-loaded-right element-not-loaded-opacity"}>Linkr</h2>
                        <p style={{ transition: "0.6s", fontStyle: 'italic' }} className={elementsLoaded ? "" : "content-not-loaded-left element-not-loaded-opacity"}>Wszystko czego potrzebujesz w jednym miejscu.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register