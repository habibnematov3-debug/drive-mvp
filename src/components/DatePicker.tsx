import { useRef, useEffect, useState } from 'react'
import { format, addDays, isSameDay, startOfToday } from 'date-fns'
import { uz, ru, enUS } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { Calendar } from './ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'
import { cn } from '../lib/utils'

type DatePickerProps = {
  label?: string
  value: string
  onChange: (next: string) => void
}

const getLocale = (lang: string) => {
  if (lang === 'ru') return ru
  if (lang === 'uz') return uz
  return enUS
}

export default function DatePicker({
  label,
  value,
  onChange,
}: DatePickerProps) {
  const { t, language } = useLanguage()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  
  const resolvedLabel = label ?? t('home.date')
  const locale = getLocale(language)
  const today = startOfToday()

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i))

  const selectedDate = value ? new Date(value) : null
  const isCustomDate = selectedDate && !dates.some(d => isSameDay(d, selectedDate))

  const handleSelect = (date: Date) => {
    const isoString = format(date, 'yyyy-MM-dd')
    onChange(isoString)
    setShowCalendar(false)
  }

  // Scroll to selected date on mount
  useEffect(() => {
    if (selectedDate && scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector('[data-selected="true"]')
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [value])

  return (
    <section className="rounded-[32px] border border-brand-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3 px-1">
        <label className="text-[1.05rem] font-semibold text-brand-ink">
          {resolvedLabel}
        </label>
        
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition",
              isCustomDate ? "text-brand-blue" : "text-brand-muted hover:text-brand-blue"
            )}>
              <CalendarIcon className="h-3.5 w-3.5" />
              {t('home.otherDate') || 'Other'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(date) => date && handleSelect(date)}
              initialFocus
              disabled={(date) => date < today}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div 
        ref={scrollRef}
        className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
      >
        {dates.map((date) => {
          const isSelected = selectedDate && isSameDay(date, selectedDate)
          const dayName = format(date, 'EEE', { locale })
          const dayNum = format(date, 'd')
          const monthName = format(date, 'MMM', { locale })

          return (
            <button
              key={date.toISOString()}
              type="button"
              data-selected={isSelected}
              onClick={() => handleSelect(date)}
              className={cn(
                "flex min-w-[64px] flex-col items-center justify-center rounded-[22px] py-3 transition-all active:scale-95",
                isSelected
                  ? "bg-brand-blue text-white shadow-soft shadow-brand-blue/30"
                  : "bg-brand-soft hover:bg-brand-soft/80 text-brand-ink"
              )}
            >
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-tight mb-0.5",
                isSelected ? "text-white/80" : "text-brand-muted"
              )}>
                {dayName}
              </span>
              <span className="text-base font-black leading-none">
                {dayNum}
              </span>
              <span className={cn(
                "text-[10px] font-bold mt-0.5",
                isSelected ? "text-white/80" : "text-brand-muted"
              )}>
                {monthName}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
