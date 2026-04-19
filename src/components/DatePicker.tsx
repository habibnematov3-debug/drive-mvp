import { useMemo, useRef, useEffect } from 'react'
import { getTodayISO, getDateISOFromNow, dateISOToDate } from '../utils/format'
import { useLanguage } from '../contexts/LanguageContext'

type DatePickerProps = {
  label?: string
  value: string
  onChange: (next: string) => void
}

export default function DatePicker({
  label,
  value,
  onChange,
}: DatePickerProps) {
  const { t, language } = useLanguage()
  const scrollRef = useRef<HTMLDivElement>(null)

  const items = useMemo(() => {
    const dates = []
    for (let i = 0; i < 14; i++) {
      const iso = getDateISOFromNow(i)
      const date = dateISOToDate(iso)
      dates.push({
        iso,
        day: date.getDate(),
        weekday: new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'uz-UZ', {
          weekday: 'short',
        }).format(date),
        month: new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'uz-UZ', {
          month: 'short',
        }).format(date),
      })
    }
    return dates
  }, [language])

  const resolvedLabel = label ?? t('home.date')

  useEffect(() => {
    if (scrollRef.current) {
      const activeItem = scrollRef.current.querySelector('[data-active="true"]')
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        })
      }
    }
  }, [value])

  return (
    <section className="rounded-[32px] border border-brand-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between px-1">
        <label className="text-[1.05rem] font-semibold text-brand-ink">
          {resolvedLabel}
        </label>
        <div className="relative overflow-hidden">
          <input
            type="date"
            value={value}
            min={getTodayISO()}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 z-10 cursor-pointer opacity-0"
          />
          <span className="text-sm font-medium text-brand-blue flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('home.otherDate') || 'Choose'}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1"
      >
        {items.map((item) => {
          const active = value === item.iso
          return (
            <button
              key={item.iso}
              type="button"
              data-active={active}
              onClick={() => onChange(item.iso)}
              className={`flex min-w-[62px] flex-col items-center rounded-[22px] py-3 transition-all duration-200 ${
                active
                  ? 'bg-brand-blue text-white shadow-md ring-4 ring-brand-blue/10 scale-105'
                  : 'bg-brand-soft/40 text-brand-ink hover:bg-brand-soft/60'
              }`}
            >
              <span className={`text-[10px] uppercase tracking-wider font-bold ${active ? 'text-white/80' : 'text-brand-muted'}`}>
                {item.weekday}
              </span>
              <span className="mt-1 text-lg font-bold">{item.day}</span>
              <span className={`text-[10px] font-medium ${active ? 'text-white/80' : 'text-brand-muted'}`}>
                {item.month}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
