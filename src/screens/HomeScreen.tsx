import { useState } from 'react'
import DatePicker from '../components/DatePicker'
import GenderPreferenceSelector from '../components/GenderPreferenceSelector'
import PassengerCountSelector from '../components/PassengerCountSelector'
import RouteSelector from '../components/RouteSelector'
import TimePicker from '../components/TimePicker'
import ToggleSwitch from '../components/ToggleSwitch'
import { routeLabels } from '../data/mock'
import type {
  PassengerGender,
  RequestFormData,
  RouteId,
} from '../types/drivee'
import {
  getDefaultTimeValue,
  getTodayISO,
} from '../utils/format'
import { formatTelegramDisplayName, getTelegramUser } from '../utils/telegram'

type HomeScreenProps = {
  onSubmitRequest: (payload: RequestFormData) => void
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

export default function HomeScreen({ onSubmitRequest }: HomeScreenProps) {
  const [routeId, setRouteId] = useState<RouteId>('kokand-tashkent')
  const [dateISO, setDateISO] = useState(getTodayISO())
  const [time, setTime] = useState(getDefaultTimeValue())
  const [passengerCount, setPassengerCount] = useState(1)
  const [fullCar, setFullCar] = useState(false)
  const [passengerGender, setPassengerGender] =
    useState<PassengerGender>('any')
  const [comment, setComment] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  function resetFormState() {
    setRouteId('kokand-tashkent')
    setDateISO(getTodayISO())
    setTime(getDefaultTimeValue())
    setPassengerCount(1)
    setFullCar(false)
    setPassengerGender('any')
    setComment('')
  }

  async function handleSubmit() {
    const requestPayload: RequestFormData = {
      routeId,
      dateISO,
      time,
      passengerCount,
      fullCar,
      passengerGender,
      comment: comment.trim() ? comment.trim() : undefined,
    }

    const user = getTelegramUser()

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')

      if (!apiBaseUrl) {
        throw new Error(
          'VITE_API_BASE_URL is not configured. Set it in Netlify and redeploy the frontend.',
        )
      }

      const response = await fetch(`${apiBaseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: routeLabels[routeId],
          date: dateISO,
          time,
          seats: passengerCount,
          comment: requestPayload.comment ?? '',
          telegram_user_id: user?.id,
          ...(formatTelegramDisplayName(user)
            ? { passenger_name: formatTelegramDisplayName(user) }
            : {}),
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

      let result: { success?: boolean; error?: string }

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

      onSubmitRequest(requestPayload)
      resetFormState()
      setIsSubmitted(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : "So'rov yuborilmadi"
      alert(message)
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
            Arizangiz qabul qilindi
          </h2>
          <p className="mt-3 text-sm leading-6 text-brand-muted">
            Tez orada sizga mos haydovchini topib, tasdiqlaymiz.
          </p>

          <button
            type="button"
            onClick={handleReset}
            className="mt-6 w-full rounded-[24px] bg-brand-blue py-4 text-base font-semibold text-white transition hover:brightness-[1.02] focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
          >
            Yana ariza qoldirish
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
        <PassengerCountSelector
          value={passengerCount}
          onChange={setPassengerCount}
        />

        <div className="mt-5 border-t border-brand-line pt-5">
          <ToggleSwitch
            checked={fullCar}
            onChange={setFullCar}
            label="Barcha o'rindiqlarni band qilish"
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
            Izoh
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="mt-3 w-full resize-none rounded-[22px] border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
            placeholder="Arizaga izoh qoldiring..."
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="mt-6 w-full rounded-[24px] bg-brand-blue py-4 text-base font-semibold text-white transition hover:brightness-[1.02] focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
        >
          Ariza qoldirish
        </button>
      </section>
    </div>
  )
}
