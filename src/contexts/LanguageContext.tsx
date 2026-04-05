import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Language } from '../types/i18n'
import { translations } from '../data/translations'
import { getTelegramUser } from '../utils/telegram'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, defaultValue?: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('uz')

  useEffect(() => {
    const saved = localStorage.getItem('drivee-language')
    if (saved === 'ru' || saved === 'uz') {
      setLanguageState(saved)
    } else {
      const telegramUser = getTelegramUser()
      const langCode = telegramUser?.language_code ?? 'uz'
      if (langCode.startsWith('ru')) {
        setLanguageState('ru')
      } else {
        setLanguageState('uz')
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('drivee-language', lang)
  }

  const t = (key: string, defaultValue: string = key): string => {
    try {
      const keys = key.split('.')
      let value: any = translations
      for (const k of keys) {
        value = value[k]
      }
      if (value && typeof value === 'object' && language in value) {
        return value[language]
      }
      return defaultValue
    } catch {
      return defaultValue
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
