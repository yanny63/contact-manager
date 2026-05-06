import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login() {

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
    return (
        <div className="login-main">
            <div className="login-form-outer-container">
                <div>
                    <h1>Zaloguj się</h1>
                    <p>Aby móc czatować ze swoimi znajomymi!</p>
                </div>
                <div className="isLine"></div>
                <form onSubmit={login} className="login-form">
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
            <div className="login-form-outer-container">

            </div>
        </div>
    )
}

export default Login