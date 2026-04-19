import { Clock } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

type TimePickerProps = {
  label?: string
  value: string
  onChange: (next: string) => void
}

// Generate time options in 15-minute intervals
const generateTimeOptions = () => {
  const options = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      options.push({ value: timeString, label: displayTime })
    }
  }
  return options
}

export default function TimePicker({
  label,
  value,
  onChange,
}: TimePickerProps) {
  const { t } = useLanguage()
  const resolvedLabel = label ?? t('home.time')
  const timeOptions = generateTimeOptions()

  return (
    <section className="rounded-[28px] border border-brand-line bg-white p-4 shadow-soft">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-brand-ink">
          {resolvedLabel}
        </label>
        
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-12 px-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-muted" />
              <SelectValue placeholder={t('home.selectTime') || 'Select time'} />
            </div>
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((time) => (
              <SelectItem key={time.value} value={time.value}>
                {time.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  )
}
