import { createContext, useContext, useState, type ReactNode } from 'react'
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
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') {
      return 'uz'
    }

    const saved = window.localStorage.getItem('drivee-language')
    if (saved === 'ru' || saved === 'uz') {
      return saved
    }

    const telegramUser = getTelegramUser()
    const langCode = telegramUser?.language_code ?? 'uz'
    return langCode.startsWith('ru') ? 'ru' : 'uz'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('drivee-language', lang)
  }

  const t = (key: string, defaultValue: string = key): string => {
    try {
      const keys = key.split('.')
      let value: unknown = translations

      for (const k of keys) {
        if (!value || typeof value !== 'object' || !(k in value)) {
          return defaultValue
        }

        value = (value as Record<string, unknown>)[k]
      }

      if (value && typeof value === 'object' && language in value) {
        const translated = (value as Record<string, unknown>)[language]
        return typeof translated === 'string' ? translated : defaultValue
      }

      return typeof value === 'string' ? value : defaultValue
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

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
