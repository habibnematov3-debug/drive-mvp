import { getTodayISO } from '../utils/format'
import { useLanguage } from '../contexts/LanguageContext'

type DatePickerProps = {
  label?: string
  value: string
  onChange: (next: string) => void
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 3.5v2M16.5 3.5v2M4 8h16M6.5 5.5h11A1.5 1.5 0 0 1 19 7v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18V7a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DatePicker({
  label,
  value,
  onChange,
}: DatePickerProps) {
  const { t } = useLanguage()
  const todayISO = getTodayISO()
  const resolvedLabel = label ?? t('home.date')

  return (
    <section className="rounded-[28px] border border-brand-line bg-white p-4 shadow-soft">
      <label className="block text-sm font-semibold text-brand-ink">
        {resolvedLabel}
      </label>
      <div className="relative mt-3">
        <input
          type="date"
          value={value}
          min={todayISO}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-[20px] border border-brand-line bg-white px-4 py-3 text-base text-brand-ink outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
        />
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-brand-muted">
          <CalendarIcon />
        </div>
      </div>
    </section>
  )
}
