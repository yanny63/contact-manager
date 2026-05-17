import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

function Nav({ search, setSearch, lightMode, setLightMode }) {

    const location = useLocation()
    const [ loaded, setLoaded ] = useState(false)

    useEffect(() => {
        setLoaded(true)
    }, [])

        function Phone() {
        return (
            <div style={{ display: "flex", gap: '14px', alignItems: "center", color: "var(--text)", fontWeight: "600"}}>
                <svg className="phoneSvg" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" width={'18px'} xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                viewBox="0 0 122.88 122.27"  xmlSpace="preserve">
                    <g>
                        <path d="M33.84,50.25c4.13,7.45,8.89,14.6,15.07,21.12c6.2,6.56,13.91,12.53,23.89,17.63c0.74,0.36,1.44,0.36,2.07,0.11 
                        c0.95-0.36,1.92-1.15,2.87-2.1c0.74-0.74,1.66-1.92,2.62-3.21c3.84-5.05,8.59-11.32,15.3-8.18c0.15,0.07,0.26,0.15,0.41,0.21
                        l22.38,12.87c0.07,0.04,0.15,0.11,0.21,0.15c2.95,2.03,4.17,5.16,4.2,8.71c0,3.61-1.33,7.67-3.28,11.1 c-2.58,4.53-6.38,7.53-10.76,
                        9.51c-4.17,1.92-8.81,2.95-13.27,3.61c-7,1.03-13.56,0.37-20.27-1.69
                        c-6.56-2.03-13.17-5.38-20.39-9.84l-0.53-0.34c-3.31-2.07-6.89-4.28-10.4-6.89C31.12,93.32,18.03,79.31,9.5,63.89
                        C2.35,50.95-1.55,36.98,0.58,23.67c1.18-7.3,4.31-13.94,9.77-18.32c4.76-3.84,11.17-5.94,19.47-5.2c0.95,0.07,1.8,0.62,
                        2.25,1.44 l14.35,24.26c2.1,2.72,2.36,5.42,1.21,8.12c-0.95,2.21-2.87,4.25-5.49,6.15c-0.77,0.66-1.69,1.33-2.66,2.03 
                        c-3.21,2.33-6.86,5.02-5.61,8.18L33.84,50.25L33.84,50.25L33.84,50.25z"/>
                    </g>
                </svg>
                <span style={{ fontStyle: "italic" }}>Linkr</span>
            </div>
        )
    }

    function Search() {
        return (
            <label className="nav-search" style={ location.pathname === '/' ? { pointerEvents: "all", opacity: "1" } : { pointerEvents: "none", opacity: "0.3" }}>
                <input className='search-input' placeholder="" onChange={(e) => {setSearch(e.target.value)}}/>
                <span>Szukaj kontaktu</span>
            </label>
        )
    }

    function Star() {
        return (
            <svg
            xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 25 25"
                fill="gold"
                stroke="gold"
                strokeWidth="2"
                style={{ width: "16px" }}>
                <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9" />
            </svg>
        )
    }

    function ThemeButton({ lightMode, setLightMode }) {
        const text = lightMode === false ? '🌙' : '☀️' 
        function changeTheme() {
            setLightMode(prev => !prev)
        }
        return (
            <button className="themeButton" onClick={changeTheme}>{text}</button>
        )
    }

    return (
        <nav className={loaded ? "nav" : "nav nav-not-loaded"}>
            <div className="nav-content">
                <NavLink to='/' style={{ textDecoration: "none" }}><Phone></Phone></NavLink>
            </div>
            <div className="nav-login">
                <ThemeButton lightMode={lightMode} setLightMode={setLightMode}></ThemeButton>
                <NavLink to='/login' className="nav-login-isButton">Zaloguj się</NavLink>
                <NavLink to='/register' className="nav-login-isButton">Zarejestruj się</NavLink>
            </div>
        </nav>
    )
}

export default Nav