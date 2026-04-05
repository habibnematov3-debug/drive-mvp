import type { PassengerGender, RequestStatus } from '../types/drivee'

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('uz-UZ', {
  day: 'numeric',
  month: 'short',
})

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat('uz-UZ', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

export function dateISOToDate(dateISO: string) {
  return new Date(`${dateISO}T00:00:00`)
}

export function formatDateUz(dateISO: string) {
  return SHORT_DATE_FORMATTER.format(dateISOToDate(dateISO))
}

export function formatFullDateUz(dateISO: string) {
  return FULL_DATE_FORMATTER.format(dateISOToDate(dateISO))
}

export function formatPriceUzs(priceUzs: number) {
  return `${Math.round(priceUzs).toLocaleString('uz-UZ')} so'm`
}

export function getTodayISO() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function getDateISOFromNow(offsetDays: number) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function getDefaultTimeValue() {
  const nextHour = new Date()
  nextHour.setMinutes(0, 0, 0)
  nextHour.setHours(nextHour.getHours() + 1)
  const hh = String(nextHour.getHours()).padStart(2, '0')
  const mm = String(nextHour.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export function formatPassengerCount(count: number, t?: (key: string) => string) {
  const label = t ? t('home.passengerSingle') : "yo'lovchi"
  const suffix = count === 1 ? label : (t ? t('home.passengerPlural') : "yo'lovchilar")
  return `${count} ${suffix}`
}

export function formatPassengerGender(gender: PassengerGender, t?: (key: string) => string) {
  if (!t) {
    // Fallback to hardcoded Uzbek for backward compatibility
    if (gender === 'male') return 'Erkak'
    if (gender === 'female') return 'Ayol'
    return "Farqi yo'q"
  }
  if (gender === 'male') return t('home.male')
  if (gender === 'female') return t('home.female')
  return t('home.noPreference')
}

export function formatRequestStatus(status: RequestStatus) {
  if (status === 'matched') return 'Haydovchi topildi'
  if (status === 'cancelled') return 'Bekor qilingan'
  return 'Qabul qilindi'
}
