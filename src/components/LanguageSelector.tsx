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
    <div className="rounded-[24px] border border-brand-line bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-brand-muted">{t('profile.language')}</div>
        <div className="text-sm font-semibold text-brand-ink">
          {language === 'ru' ? 'Russkiy' : "O'zbekcha"}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-[18px] bg-brand-soft p-1.5">
        <button
          type="button"
          onClick={() => handleLanguageChange('uz')}
          className={
            language === 'uz'
              ? 'rounded-[14px] bg-white px-3 py-2 text-sm font-semibold text-brand-blue shadow-soft'
              : 'rounded-[14px] px-3 py-2 text-sm font-semibold text-brand-ink hover:bg-white/70'
          }
        >
          O'zbekcha
        </button>
        <button
          type="button"
          onClick={() => handleLanguageChange('ru')}
          className={
            language === 'ru'
              ? 'rounded-[14px] bg-white px-3 py-2 text-sm font-semibold text-brand-blue shadow-soft'
              : 'rounded-[14px] px-3 py-2 text-sm font-semibold text-brand-ink hover:bg-white/70'
          }
        >
          Russkiy
        </button>
      </div>
    </div>
  )
}
