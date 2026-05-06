import { useState } from 'react'
import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Nav from './components/nav.jsx'
import Form from './components/form.jsx'
import Login from "./components/login.jsx"


function App() {
  const [ lightMode, setLightMode ] = useState(false)
  const [ search, setSearch ] = useState('')

  useEffect(() => {
    document.body.classList.toggle('light', lightMode)
  }, [lightMode])
  return (
    <>
      <Nav search={search} setSearch={setSearch} lightMode={lightMode} setLightMode={setLightMode} ></Nav>
      <Routes>
        <Route path='/' element={ <Form search={search} setSearch={setSearch} /> } />
        <Route path='/login' element={ <Login /> } />
      </Routes>
    </>
  )
}

export default App