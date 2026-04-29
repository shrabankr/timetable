import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { TimetableProvider } from './store/TimetableContext.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { ToastProvider } from './components/Toast.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TimetableProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </TimetableProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
