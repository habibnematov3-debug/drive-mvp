import { useLanguage } from '../contexts/LanguageContext'
import type { Language } from '../types/i18n'

type LanguageSelectorProps = {
  onLanguageChange?: (language: Language) => void
}

export default function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage()

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    onLanguageChange?.(lang)
  }

  return (
    <div className="rounded-[24px] border border-brand-line bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-xs text-brand-muted">{t('profile.language')}</div>
          <div className="text-sm font-semibold text-brand-ink">
            {language === 'ru' ? 'Русский' : "O'zbekcha"}
          </div>
        </div>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="text-brand-muted"
        >
          <path
            d="M9 18l6-6-6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="border-t border-brand-line">
        <button
          type="button"
          onClick={() => handleLanguageChange('uz')}
          className={`w-full px-4 py-3 text-left text-sm font-semibold transition ${
            language === 'uz'
              ? 'bg-brand-blue-soft text-brand-blue'
              : 'bg-white text-brand-ink hover:bg-brand-soft'
          }`}
        >
          O'zbekcha (Uzbek)
        </button>
      </div>

      <div className="border-t border-brand-line">
        <button
          type="button"
          onClick={() => handleLanguageChange('ru')}
          className={`w-full px-4 py-3 text-left text-sm font-semibold transition ${
            language === 'ru'
              ? 'bg-brand-blue-soft text-brand-blue'
              : 'bg-white text-brand-ink hover:bg-brand-soft'
          }`}
        >
          Русский (Russian)
        </button>
      </div>
    </div>
  )
}
