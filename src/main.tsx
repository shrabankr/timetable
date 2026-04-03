import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { TimetableProvider } from './store/TimetableContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TimetableProvider>
      <App />
    </TimetableProvider>
  </React.StrictMode>,
)
