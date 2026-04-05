import { useState } from 'react'
import DatePicker from '../components/DatePicker'
import GenderPreferenceSelector from '../components/GenderPreferenceSelector'
import PassengerCountSelector from '../components/PassengerCountSelector'
import RouteSelector from '../components/RouteSelector'
import TimePicker from '../components/TimePicker'
import ToggleSwitch from '../components/ToggleSwitch'
import { useLanguage } from '../contexts/LanguageContext'
import { routeLabels } from '../data/mock'
import type {
  PassengerGender,
  RequestFormData,
  RouteId,
} from '../types/drivee'
import { getApiBaseUrl } from '../utils/api'
import { buildTelegramAuthHeaders } from '../utils/telegram'
import {
  getDefaultTimeValue,
  getTodayISO,
} from '../utils/format'

type HomeScreenProps = {
  onSubmitRequest: (payload: RequestFormData, bookingId: string) => void
  passengerName?: string
  telegramUserId?: string
}

const PHONE_REGEX = /^\+998\d{9}$/

function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '')

  if (!digits) return ''
  if (digits.startsWith('998')) return `+${digits.slice(0, 12)}`
  if (digits.length <= 9) return `+998${digits}`
  return `+${digits}`
}

function SuccessIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke="#2F97D4"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function HomeScreen({
  onSubmitRequest,
  passengerName,
  telegramUserId,
}: HomeScreenProps) {
  const { t } = useLanguage()
  const [routeId, setRouteId] = useState<RouteId>('kokand-tashkent')
  const [dateISO, setDateISO] = useState(getTodayISO())
  const [time, setTime] = useState(getDefaultTimeValue())
  const [passengerPhone, setPassengerPhone] = useState('')
  const [passengerCount, setPassengerCount] = useState(1)
  const [fullCar, setFullCar] = useState(false)
  const [passengerGender, setPassengerGender] =
    useState<PassengerGender>('any')
  const [hasBag, setHasBag] = useState(false)
  const [comment, setComment] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function resetFormState() {
    setRouteId('kokand-tashkent')
    setDateISO(getTodayISO())
    setTime(getDefaultTimeValue())
    setPassengerPhone('')
    setPassengerCount(1)
    setFullCar(false)
    setPassengerGender('any')
    setHasBag(false)
    setComment('')
    setSubmitError(null)
  }

  async function handleSubmit() {
    if (isSubmitting) return

    const normalizedPhone = normalizePhoneNumber(passengerPhone)

    if (!normalizedPhone) {
      setSubmitError(t('home.phoneRequired'))
      return
    }

    if (!PHONE_REGEX.test(normalizedPhone)) {
      setSubmitError(t('home.phoneFormat'))
      return
    }

    const requestPayload: RequestFormData = {
      routeId,
      dateISO,
      time,
      passengerPhone: normalizedPhone,
      passengerCount,
      fullCar,
      passengerGender,
      hasBag,
      comment: comment.trim() ? comment.trim() : undefined,
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const apiBaseUrl = getApiBaseUrl()

      if (!apiBaseUrl) {
        throw new Error(
          'VITE_API_BASE_URL is not configured. Set it and redeploy the frontend.',
        )
      }

      const response = await fetch(`${apiBaseUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildTelegramAuthHeaders(telegramUserId),
        },
        body: JSON.stringify({
          route_id: routeId,
          route: routeLabels[routeId],
          date: dateISO,
          time,
          passenger_phone: normalizedPhone,
          seats: passengerCount,
          full_car: fullCar,
          has_bag: hasBag,
          passenger_gender: passengerGender,
          comment: requestPayload.comment ?? '',
          ...(passengerName ? { passenger_name: passengerName } : {}),
        }),
      })

      const responseBody = await response.text()
      const contentType = response.headers.get('content-type') ?? ''
      const statusLabel = `${response.status} ${response.statusText}`.trim()

      if (!contentType.includes('application/json')) {
        throw new Error(
          `API returned non-JSON response (${statusLabel}): ${responseBody}`,
        )
      }

      let result: { success?: boolean; error?: string; booking_id?: string }

      try {
        result = JSON.parse(responseBody) as {
          success?: boolean
          error?: string
        }
      } catch {
        throw new Error(`API returned invalid JSON (${statusLabel}): ${responseBody}`)
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Request failed (${statusLabel})`)
      }

      if (!result.booking_id) {
        throw new Error('booking_id was not returned by the API')
      }

      onSubmitRequest(requestPayload, result.booking_id)
      resetFormState()
      setIsSubmitted(true)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : t('home.submit'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleReset() {
    resetFormState()
    setIsSubmitted(false)
  }

  if (isSubmitted) {
    return (
      <div className="pb-4 pt-1">
        <section className="rounded-[32px] border border-brand-line bg-white px-5 py-8 text-center shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue-soft">
            <SuccessIcon />
          </div>
          <h2 className="mt-5 text-[1.75rem] font-bold leading-tight text-brand-ink">
            {t('home.bookingSuccess')}
          </h2>
          <p className="mt-3 text-sm leading-6 text-brand-muted">
            {t('home.bookingSuccessDesc')}
          </p>

          <button
            type="button"
            onClick={handleReset}
            className="mt-6 w-full rounded-[24px] bg-brand-blue py-4 text-base font-semibold text-white transition hover:brightness-[1.02] focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
          >
            {t('home.newBooking')}
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="pb-4 pt-1">
      <div className="space-y-3">
        <RouteSelector value={routeId} onChange={setRouteId} />
        <DatePicker value={dateISO} onChange={setDateISO} />
        <TimePicker value={time} onChange={setTime} />
      </div>

      <section className="mt-4 rounded-[32px] border border-brand-line bg-white p-4 shadow-soft">
        <div>
          <label className="block text-[1.05rem] font-semibold text-brand-ink">
            {t('home.phone')}
          </label>
          <input
            value={passengerPhone}
            onChange={(e) => setPassengerPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="mt-3 w-full rounded-[22px] border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
            placeholder="+998901234567"
          />
          <p className="mt-2 text-xs text-brand-muted">
            {t('home.phoneHelper')}
          </p>
        </div>

        <PassengerCountSelector
          value={passengerCount}
          onChange={setPassengerCount}
        />

        <div className="mt-5 border-t border-brand-line pt-5">
          <ToggleSwitch
            checked={hasBag}
            onChange={setHasBag}
            label={t('home.hasBagLabel')}
          />
          <p className="mt-2 text-xs text-brand-muted">
            {t('home.bagHelper')}
          </p>
        </div>

        <div className="mt-5 border-t border-brand-line pt-5">
          <ToggleSwitch
            checked={fullCar}
            onChange={setFullCar}
            label={t('home.fullCarLabel')}
          />
        </div>

        <div className="mt-5 border-t border-brand-line pt-5">
          <GenderPreferenceSelector
            value={passengerGender}
            onChange={setPassengerGender}
          />
        </div>

        <div className="mt-5 border-t border-brand-line pt-5">
          <label className="block text-[1.05rem] font-semibold text-brand-ink">
            {t('home.comment')}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="mt-3 w-full resize-none rounded-[22px] border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
            placeholder={t('home.commentPlaceholder')}
          />
        </div>

        {submitError ? (
          <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-[24px] bg-brand-blue py-4 text-base font-semibold text-white transition hover:brightness-[1.02] disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
        >
          {isSubmitting ? t('home.submitting') : t('home.submit')}
        </button>
      </section>
    </div>
  )
}
