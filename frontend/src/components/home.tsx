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

const colors = [
  "#4F6EF7", "#E05A5A", "#2AAA8A", "#D4823A",
  "#9B59B6", "#1A7FC1", "#27AE60", "#C0392B",
]

interface User {
  phone: string
  nickname?: string
  prefix: string
}

interface AvatarPerson {
  nickname: string | null;
  phone: string;
  prefix: string;
}

function getInitials(name: string): string {
  if (!name?.trim()) return "?";

  const parts = name.trim().split(" ").filter(Boolean);
  if (parts[0].startsWith("+")) return "#";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts.at(-1)![0]).toUpperCase();
}

function getColor(name: string | null): string {
  if (!name) return colors[0];

  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[hash % colors.length];
}

function Avatar({ user, size = 40 }: { user: AvatarPerson | null; size?: number }) {
  if (!user) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "#ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        ?
      </div>
    );
  }

  const label = user.nickname
    ? getInitials(user.nickname)
    : `+${user.prefix}`;
  
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: getColor(user.nickname ?? user.phone),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 500,
        color: "#fff",
      }}
    >
      {label}
    </div>
  );
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
            Avatar={Avatar}
            inputRef={inputRef}
          />
        </aside>
        <AsideCloser asideClosed={asideClosed} setAsideClosed={setAsideClosed} />
      </div>
      <article className='articleWrapper'>
        <Main asideVisible={asideVisible} setAsideVisible={setAsideVisible} numbers={numbers} setNumbers={setNumbers} Avatar={Avatar} inputRef={inputRef} setAsideClosed={setAsideClosed} lightMode={lightMode} />
      </article>
    </div>
  )
}

export default Home