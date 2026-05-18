import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../ts/api";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import { useUser } from "../../contexts/context";
import { Link } from "react-router-dom";

function Login({ lightMode }) {

    const [ mainLoaded, setMainLoaded ] = useState(false)
    const [ elementsLoaded, setElementsLoaded ] = useState(false)
    const [ loginError, setLoginError ] = useState(false)
    const [ value, setValue ] = useState('')

    const { loadUser } = useUser()

    useEffect(() => {
        setMainLoaded(true)
        setTimeout(() => {
            setElementsLoaded(true)
        }, 400);
    }, [])

    const navigate = useNavigate()

    interface loginCredentials {
        phone: string
        prefix: string
        password: string
    }

    async function log(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!value) return
        const data = new FormData(e.currentTarget)
        const form = Object.fromEntries(data)
        const parsedPhone = parsePhoneNumber(value)
        const credentials : loginCredentials = {
            phone: parsedPhone.nationalNumber,
            prefix: parsedPhone.countryCallingCode,
            password: form.password as string
        }
        const user = await login(credentials.phone, credentials.prefix, credentials.password)
        console.log(user)
        if (!user) {
            setLoginError(true)
            return
        }
        await loadUser()
        navigate("/")
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
        <div className={mainLoaded ? "login-main" : "login-main main-not-loaded"}>
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
            <div className="login-form-outer-container">
                <div>
                    <h1 style={{ transition: "0.6s" }} className={elementsLoaded ? "" : "content-not-loaded-left element-not-loaded-opacity"}>Zaloguj się</h1>
                    <p style={{ transition: "0.6s" }} className={elementsLoaded ? "" : "content-not-loaded-right element-not-loaded-opacity"}>Aby móc czatować ze swoimi znajomymi!</p>
                </div>
                <div className="isLine"></div>
                <form onSubmit={log} className={ elementsLoaded ? "login-form" : "login-form element-not-loaded-opacity" }>
                    <div className="login-form-inner-container">
                        <PhoneInput international 
                            defaultCountry="PL"
                            value={value}
                            onChange={setValue}
                        />
                        {/* <label htmlFor='phone'>Numer Telefonu</label>
                        <input className="form-input" name='phone' id='phone' type='number' placeholder='+48 541 926 014' /> */}
                    </div>
                    <div className="login-form-inner-container">
                        <label htmlFor="password">Hasło</label>
                        <input className="form-input" name='password' type="password" id='password' placeholder='••••••••••••' />
                    </div>
                    <button className="form-button">Zaloguj się</button>
                </form>
                <div className={elementsLoaded ? "auth-bottom-text" : "auth-bottom-text element-not-loaded-opacity"}>
                    <p>Nie posiadasz konta?</p>
                    <Link to={'/auth/register'} className='auth-link'>Zarejestruj się</Link>
                </div>
            </div>
        </div>
    )
}

export default Login