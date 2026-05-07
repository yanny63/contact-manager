import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login(lightMode) {

    const [ mainLoaded, setMainLoaded ] = useState(false)
    const [ elementsLoaded, setElementsLoaded ] = useState(false)

    useEffect(() => {
        setMainLoaded(true)
        setTimeout(() => {
            setElementsLoaded(true)
        }, 400);
    }, [])

    const navigate = useNavigate()

    async function login(e) {
        e.preventDefault()
        const data = new FormData(e.target)
        const user = Object.fromEntries(data)
        console.log(user)

        try {
            const res = await fetch('/login', {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(user)
            })
            if (!res.ok) {
                throw new Error(res.details)
            }
            const data = await res.json()
            localStorage.setItem('token', data.access_token)
            navigate('/')
        }
        catch (err) {
            console.log(`Error - ${err}`)
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
        <div className={mainLoaded ? "login-main" : "login-main main-not-loaded"}>
            <div className="login-form-outer-container">
                <div className="login-inner-container-left isGradient">
                    <div style={{ transition: "1s" }} className={ elementsLoaded ? "login-inner-container-logo" : "login-inner-container-logo element-not-loaded-opacity"}> 
                        <StarLogo lightMode={lightMode}></StarLogo>
                    </div>
                    <div className="login-inner-container-isElement">
                        <h2 style={{ transition: "0.6s" }} className={elementsLoaded ? "" : "content-not-loaded-right element-not-loaded-opacity"}>Contact Manager</h2>
                        <p style={{ transition: "0.6s" }} className={elementsLoaded ? "" : "content-not-loaded-left element-not-loaded-opacity"}>Wszystko czego potrzebujesz w jednym miejscu.</p>
                    </div>
                </div>
            </div>
            <div className="login-form-outer-container">
                <div>
                    <h1 style={{ transition: "0.6s" }} className={elementsLoaded ? "" : "content-not-loaded-left element-not-loaded-opacity"}>Zaloguj się</h1>
                    <p style={{ transition: "0.6s" }} className={elementsLoaded ? "" : "content-not-loaded-right element-not-loaded-opacity"}>Aby móc czatować ze swoimi znajomymi!</p>
                </div>
                <div className="isLine"></div>
                <form onSubmit={login} className={ elementsLoaded ? "login-form" : "login-form element-not-loaded-opacity" }>
                    <div className="login-form-inner-container">
                        <label htmlFor='phone'>Numer Telefonu</label>
                        <input className="form-input" name='phone' id='phone' type='number' placeholder='111 222 333' />
                    </div>
                    <div className="login-form-inner-container">
                        <label htmlFor="password">Hasło</label>
                        <input className="form-input" name='password' type="password" id='password' placeholder='••••••••••••' />
                    </div>
                    <button className="form-button">Zaloguj się</button>
                </form>
            </div>
        </div>
    )
}

export default Login