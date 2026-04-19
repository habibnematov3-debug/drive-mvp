import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Phone } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import DatePicker from './DatePicker'
import GenderPreferenceSelector from './GenderPreferenceSelector'
import PassengerCountSelector from './PassengerCountSelector'
import RouteSelector from './RouteSelector'
import TimePicker from './TimePicker'
import ToggleSwitch from './ToggleSwitch'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { rideRequestSchema, type RideRequestFormData } from '../lib/validation'
import type { RequestFormData } from '../types/drivee'
import {
  getDefaultTimeValue,
  getTodayISO,
  normalizePhoneNumber,
  PHONE_REGEX,
} from '../utils/format'

type RideFormProps = {
  onSubmitRequest: (payload: RequestFormData, bookingId: string) => void
  isSubmitting?: boolean
  submitError?: string | null
}

export default function RideForm({
  onSubmitRequest,
  isSubmitting = false,
  submitError = null,
}: RideFormProps) {
  const { t } = useLanguage()
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<RideRequestFormData>({
    resolver: zodResolver(rideRequestSchema),
    defaultValues: {
      routeId: 'kokand-tashkent',
      dateISO: getTodayISO(),
      time: getDefaultTimeValue(),
      passengerPhone: '',
      passengerCount: 1,
      fullCar: false,
      passengerGender: 'any',
      hasBag: false,
      comment: '',
    },
  })

  const watchedValues = watch()

  const onSubmit = async (data: RideRequestFormData) => {
    if (isSubmitting) return

    const normalizedPhone = normalizePhoneNumber(data.passengerPhone)

    if (!normalizedPhone || !PHONE_REGEX.test(normalizedPhone)) {
      return
    }

    const requestPayload: RequestFormData = {
      routeId: data.routeId,
      dateISO: data.dateISO,
      time: data.time,
      passengerPhone: normalizedPhone,
      passengerCount: data.passengerCount,
      fullCar: data.fullCar,
      passengerGender: data.passengerGender,
      hasBag: data.hasBag,
      comment: data.comment?.trim() || undefined,
    }

    // Generate a simple booking ID for now
    const bookingId = `BK${Date.now()}`
    
    onSubmitRequest(requestPayload, bookingId)
    setIsSubmitted(true)
  }

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors)
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 6 9 17l-5-5"
              stroke="#2F97D4"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-brand-ink mb-2">
          {t('home.successTitle') || 'Booking Submitted!'}
        </h2>
        <p className="text-brand-muted text-center mb-6">
          {t('home.successMessage') || 'Your ride request has been submitted successfully. We will contact you soon.'}
        </p>
        <Button onClick={() => {
          setIsSubmitted(false)
          reset()
        }}>
          {t('home.newBooking') || 'New Booking'}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-3">
      {/* Route Selector */}
      <div>
        <RouteSelector
          value={watchedValues.routeId}
          onChange={(value) => setValue('routeId', value)}
        />
        {errors.routeId && (
          <p className="text-red-500 text-xs mt-1">{errors.routeId.message}</p>
        )}
      </div>

      {/* Date Picker */}
      <div>
        <DatePicker
          value={watchedValues.dateISO}
          onChange={(date) => setValue('dateISO', date)}
        />
        {errors.dateISO && (
          <p className="text-red-500 text-xs mt-1">{errors.dateISO.message}</p>
        )}
      </div>

      {/* Time Picker */}
      <div>
        <TimePicker
          value={watchedValues.time}
          onChange={(time) => setValue('time', time)}
        />
        {errors.time && (
          <p className="text-red-500 text-xs mt-1">{errors.time.message}</p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-sm font-semibold text-brand-ink mb-2">
          {t('home.phone') || 'Phone Number'}
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-muted" />
          <Input
            {...register('passengerPhone')}
            type="tel"
            placeholder="+998901234567"
            className="pl-10 h-12"
            onChange={(e) => {
              const normalized = normalizePhoneNumber(e.target.value)
              setValue('passengerPhone', normalized)
            }}
          />
        </div>
        {errors.passengerPhone && (
          <p className="text-red-500 text-sm mt-1">{errors.passengerPhone.message}</p>
        )}
      </div>

      {/* Passenger Count */}
      <div>
        <PassengerCountSelector
          value={watchedValues.passengerCount}
          onChange={(value) => setValue('passengerCount', value)}
        />
        {errors.passengerCount && (
          <p className="text-red-500 text-sm mt-1">{errors.passengerCount.message}</p>
        )}
      </div>

      {/* Full Car Toggle */}
      <div>
        <ToggleSwitch
          label={t('home.fullCar') || 'Full Car'}
          checked={watchedValues.fullCar}
          onChange={(checked) => setValue('fullCar', checked)}
        />
      </div>

      {/* Gender Preference */}
      <div>
        <GenderPreferenceSelector
          value={watchedValues.passengerGender}
          onChange={(value) => setValue('passengerGender', value)}
        />
        {errors.passengerGender && (
          <p className="text-red-500 text-sm mt-1">{errors.passengerGender.message}</p>
        )}
      </div>

      {/* Has Bag Toggle */}
      <div>
        <ToggleSwitch
          label={t('home.hasBag') || 'Has Luggage'}
          checked={watchedValues.hasBag}
          onChange={(checked) => setValue('hasBag', checked)}
        />
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-semibold text-brand-ink mb-2">
          {t('home.comment') || 'Additional Comments'}
        </label>
        <textarea
          {...register('comment')}
          rows={3}
          placeholder={t('home.commentPlaceholder') || 'Any special requirements...'}
          className="w-full rounded-[20px] border border-brand-line bg-white px-4 py-3 text-base text-brand-ink outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 resize-none"
        />
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{submitError}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 text-base font-semibold"
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {t('home.submitting') || 'Submitting...'}
          </div>
        ) : (
          t('home.submit') || 'Submit Booking'
        )}
      </Button>
    </form>
  )
}
