import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import ServerWakingBanner from './components/ServerWakingBanner.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <ToastProvider>
          <ServerWakingBanner />
          <App />
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>,
)
