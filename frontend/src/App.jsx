import { useState } from 'react'
import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Nav from './components/nav.jsx'
import Home from './components/home.jsx'
import Auth from "./components/auth.tsx"


function App() {
  const [ lightMode, setLightMode ] = useState(() => {
    return localStorage.getItem('lightMode') === 'true'
  })

  const [ search, setSearch ] = useState('')

  useEffect(() => {
    document.body.classList.toggle('light', lightMode)
    localStorage.setItem('lightMode', lightMode)
  }, [lightMode])
  return (
    <div className='app-main'>
      <Nav lightMode={lightMode} setLightMode={setLightMode} ></Nav>
      <Routes>
        <Route path='/' element={ <Home search={search} setSearch={setSearch} /> } />
        <Route path='/auth/:type' element={ <Auth lightMode={lightMode} /> } />
      </Routes>
    </div>
  )
} 

export default App