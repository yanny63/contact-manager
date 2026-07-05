import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './css/auth.css'
import './skeletons/skeleton.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './contexts/context'
import { ChatProvider } from './contexts/chat'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <UserProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </UserProvider>
  </BrowserRouter>
)
