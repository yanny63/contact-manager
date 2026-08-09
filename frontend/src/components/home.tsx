import { useEffect, useState, useRef } from 'react';
import Aside from './home-aside';
import Main from './home-main'
import { checkToken } from '../ts/api';
import { useUser } from '../contexts/context';

interface NumberType {
  id: number
  phone: string
  prefix: string
  nickname: string
  avatar?: string 
  favourite: boolean
}

interface User {
  phone: string
  nickname?: string
  prefix: string
}


function AsideCloser({ asideClosed, setAsideClosed }) {
  return (
    <button 
      onClick={() => setAsideClosed(prev => !prev)} 
      className={asideClosed ? "aside-close-button aside-button-closed" : "aside-close-button"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    </button>
  )
}

function Home({ search, setSearch, lightMode }) {
  const [ error, setError ] = useState('')
  const [ loaded, setLoaded ] = useState(false)
  const [ asideClosed, setAsideClosed ] = useState(false)
  const [ numbers, setNumbers ] = useState<NumberType[]>([])
  const [ asideVisible, setAsideVisible ] = useState(true)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <div className="main-container">
      <div className={asideClosed ? 'asideWrapper aside-not-visible' : 'asideWrapper'}> 
        <aside className={`${loaded ? 'home-aside' : 'home-aside element-not-loaded-opacity content-not-loaded-left'} ${asideClosed ? 'aside-not-visible' : ''}`}>
          <Aside 
            onError={setError} 
            search={search} 
            setSearch={setSearch} 
            checkToken={checkToken} 
            numbers={numbers} 
            setNumbers={setNumbers} 
            inputRef={inputRef}
          />
        </aside>
        <AsideCloser asideClosed={asideClosed} setAsideClosed={setAsideClosed} />
      </div>
      <article className='articleWrapper'>
        <Main asideVisible={asideVisible} setAsideVisible={setAsideVisible} numbers={numbers} setNumbers={setNumbers} inputRef={inputRef} setAsideClosed={setAsideClosed} lightMode={lightMode} />
      </article>
    </div>
  )
}

export default Home