import { useState } from 'react'
import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Nav from './components/nav.jsx'
import Form from './components/form.jsx'
import Login from "./components/login.jsx"
import Register from "./components/register.jsx"


function App() {
  const [ lightMode, setLightMode ] = useState(() => {
    return localStorage.getItem('lightMode') === 'true'
  })
  const [ search, setSearch ] = useState('')

  useEffect(() => {
    document.body.classList.toggle('light', lightMode)
    console.log(lightMode)
    localStorage.setItem('lightMode', lightMode)
  }, [lightMode])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Nav search={search} setSearch={setSearch} lightMode={lightMode} setLightMode={setLightMode} ></Nav>
      <Routes>
        <Route path='/' element={ <Form search={search} setSearch={setSearch} /> } />
        <Route path='/login' element={ <Login lightMode={lightMode} /> } />
        <Route path='/register' element={ <Register /> } />
      </Routes>
    </div>
  )
} 

export default App