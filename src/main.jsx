import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './base.css'
import './athletehub.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
