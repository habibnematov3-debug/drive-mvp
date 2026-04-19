import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/telegram.css'
import App from './App.tsx'
import { LanguageProvider } from './contexts/LanguageContext.tsx'

// Fixed typo: creatRoot -> createRoot
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
