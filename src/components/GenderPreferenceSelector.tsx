import { useLanguage } from '../contexts/LanguageContext'
import type { PassengerGender } from '../types/drivee'

type GenderPreferenceSelectorProps = {
  value: PassengerGender
  onChange: (next: PassengerGender) => void
}

export default function GenderPreferenceSelector({
  value,
  onChange,
}: GenderPreferenceSelectorProps) {
  const { t } = useLanguage()
  const options: Array<{ value: PassengerGender; label: string }> = [
    { value: 'any', label: t('home.noPreference') },
    { value: 'male', label: t('home.male') },
    { value: 'female', label: t('home.female') },
  ]

  return (
    <div>
      <div className="text-[1.05rem] font-semibold text-brand-ink">{t('home.gender')}</div>
      <div className="mt-1 text-sm text-brand-muted">{t('home.genderHelp')}</div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const isActive = option.value === value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={
                isActive
                  ? 'flex items-center gap-2 rounded-[18px] border border-brand-blue bg-brand-blue-soft px-4 py-3 text-sm font-semibold text-brand-blue transition'
                  : 'flex items-center gap-2 rounded-[18px] border border-brand-line bg-white px-4 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-soft/60'
              }
            >
              <span
                className={
                  isActive
                    ? 'h-4 w-4 rounded-full border-[5px] border-brand-blue bg-white'
                    : 'h-4 w-4 rounded-full border border-brand-line bg-white'
                }
              />
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
