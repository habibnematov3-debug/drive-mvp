import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/telegram.css'
import App from './App.tsx'
import { LanguageProvider } from './contexts/LanguageContext.tsx'
import { DriveeProvider } from './contexts/DriveeContext.tsx'

// Fixed typo: creatRoot -> createRoot
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <DriveeProvider>
        <App />
      </DriveeProvider>
    </LanguageProvider>
  </StrictMode>,
)
