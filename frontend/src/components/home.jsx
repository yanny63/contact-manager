import { useEffect, useState } from 'react';
import Aside from './home-aside'

function Home({ search, setSearch }) {

    const [ error, setError ] = useState('')
    const [ loaded, setLoaded ] = useState(false)
    const [ asideClosed, setAsideClosed ] = useState(false)

    useEffect(() => {
        setLoaded(true)
    }, [])

    function AsideCloser() {
        function closeAside() {
            setAsideClosed(prev => !prev)
        }
        return (
            <button onClick={closeAside} className={ asideClosed ? "aside-close-button aside-button-closed" : "aside-close-button"}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                </svg>
            </button>
        )
    }
    
    return (
        <div className="main-container">
            <div className={asideClosed ? 'asideWrapper aside-not-visible' : 'asideWrapper'}> 
                <aside className={`${loaded ? 'home-aside' : 'home-aside element-not-loaded-opacity content-not-loaded-left'} ${asideClosed ? 'aside-not-visible' : ''}`}>
                    <Aside onError={setError} search={search} setSearch={setSearch} />
                </aside>
                <AsideCloser></AsideCloser>
            </div>
            <article className='home-article'>

            </article>
            <div className='error-container' style={ error ? "" : { display: 'none', pointerEvents: 'none'}}>

            </div>
        </div>
    )
}

export default Home