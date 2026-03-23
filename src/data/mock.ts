import type { Passenger, RideRequest, RouteId } from '../types/drivee'
import { getDateISOFromNow } from '../utils/format'

export const routeLabels: Record<RouteId, string> = {
  'kokand-tashkent': 'Kokand → Tashkent',
  'tashkent-kokand': 'Tashkent → Kokand',
}

export const mockUser: Passenger = {
  name: 'Madina Karimova',
  secondaryLine: '+998 90 123-45-67',
  languageLabel: "O'zbekcha",
}

export const initialRequests: RideRequest[] = (() => {
  const tomorrow = getDateISOFromNow(1)
  const dayAfterTomorrow = getDateISOFromNow(2)
  const yesterday = getDateISOFromNow(-1)

  const make = (
    args: Omit<RideRequest, 'routeLabel' | 'createdAtISO'> & {
      routeId: RouteId
      createdAtISO?: string
    },
  ): RideRequest => ({
    ...args,
    routeLabel: routeLabels[args.routeId],
    createdAtISO: args.createdAtISO ?? new Date().toISOString(),
  })

  return [
    make({
      id: 'AR-1002',
      routeId: 'kokand-tashkent',
      dateISO: tomorrow,
      time: '08:30',
      passengerCount: 1,
      fullCar: false,
      passengerGender: 'any',
      status: 'submitted',
      comment: "Tonggi vaqt bo'lsa qulay.",
    }),
    make({
      id: 'AR-998',
      routeId: 'tashkent-kokand',
      dateISO: dayAfterTomorrow,
      time: '14:00',
      passengerCount: 2,
      fullCar: true,
      passengerGender: 'male',
      status: 'matched',
      comment: "Haydovchi oldindan qo'ng'iroq qilsa yaxshi.",
    }),
    make({
      id: 'AR-910',
      routeId: 'kokand-tashkent',
      dateISO: yesterday,
      time: '18:15',
      passengerCount: 1,
      fullCar: false,
      passengerGender: 'female',
      status: 'cancelled',
    }),
  ]
})()
