import { useState } from 'react'
import RideForm from '../components/RideForm'
import { useLanguage } from '../contexts/LanguageContext'
import { routeLabels } from '../data/mock'
import type { RequestFormData } from '../types/drivee'
import { getApiBaseUrl } from '../utils/api'
import { buildTelegramAuthHeaders } from '../utils/telegram'

type HomeScreenProps = {
  onSubmitRequest: (payload: RequestFormData, bookingId: string) => void
  passengerName?: string
  telegramUserId?: string
}

export default function HomeScreen({
  onSubmitRequest,
  passengerName,
  telegramUserId,
}: HomeScreenProps) {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleFormSubmit = async (payload: RequestFormData, _bookingId: string) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const apiBaseUrl = getApiBaseUrl()

      if (!apiBaseUrl) {
        throw new Error(
          'VITE_API_BASE_URL is not configured. Set it and redeploy frontend.',
        )
      }

      const response = await fetch(`${apiBaseUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildTelegramAuthHeaders(telegramUserId),
        },
        body: JSON.stringify({
          route_id: payload.routeId,
          route: routeLabels[payload.routeId as keyof typeof routeLabels],
          date: payload.dateISO,
          time: payload.time,
          passenger_phone: payload.passengerPhone,
          seats: payload.passengerCount,
          full_car: payload.fullCar,
          has_bag: payload.hasBag,
          passenger_gender: payload.passengerGender,
          comment: payload.comment ?? '',
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
        throw new Error('booking_id was not returned by API')
      }

      // Call the original onSubmitRequest with the payload and booking ID
      onSubmitRequest(payload, result.booking_id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('home.submitError')
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="form-container px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-black text-brand-ink mb-2 tracking-tight">
          {t('home.title') || 'Book Your Trip'}
        </h1>
        <p className="text-sm font-medium text-brand-muted leading-relaxed max-w-[240px] mx-auto">
          {t('home.subtitle') || 'Quick and comfortable intercity travels'}
        </p>
      </div>

      <RideForm
        onSubmitRequest={handleFormSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  )
}
