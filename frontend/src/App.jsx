import { useState } from 'react'
import { useEffect } from 'react'
import Nav from './components/nav.jsx'
import Form from './components/form.jsx'


function App() {
  const [ lightMode, setLightMode ] = useState(false)
  const [ search, setSearch ] = useState('')

  useEffect(() => {
    document.body.classList.toggle('light', lightMode)
  }, [lightMode])
  return (
    <div className='main'>
      <Nav search={search} setSearch={setSearch} lightMode={lightMode} setLightMode={setLightMode}/>
      <Form search={search} setSearch={setSearch} />
    </div>
  )
}

export default App