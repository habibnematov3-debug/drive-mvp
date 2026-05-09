import type {
  DriverApplication,
  DriverProfile,
  DriverRide,
  PassengerPreference,
  PassengerRequest,
  PendingRating,
  TelegramIdentity,
  UserLocation,
  UserRole,
} from '../types/drivee'
import { getDistrict, getRegion } from '../data/uzbekistan'

type PersistedState = {
  role?: UserRole
  location?: UserLocation
  identity?: TelegramIdentity
}

const STORAGE_KEY = 'drivee-mvp-state-v2'
const DEMO_DRIVER_ID = 'drv_1'

export type DriveeState = PersistedState & {
  requests: PassengerRequest[]
  drivers: DriverProfile[]
  driverRides: DriverRide[]
  pendingRatings: PendingRating[]
}

export type DriveeActions = {
  setRole: (role: UserRole) => void
  setIdentity: (identity: TelegramIdentity) => void
  setLocation: (location: UserLocation) => void
  clearLocation: () => void
  createPassengerRequest: (payload: {
    destinationRegionId: PassengerRequest['destinationRegionId']
    dateISO: string
    timeApprox: string
    seats: number
    preferences: PassengerPreference[]
  }) => void
  createDriverRide: (payload: Omit<DriverRide, 'id' | 'driverId' | 'origin' | 'status' | 'createdAtISO'>) => void
  applyToRequestAsDriver: (requestId: string, payload: Omit<DriverApplication, 'id' | 'createdAtISO' | 'requestId'>) => void
  selectDriverForRequest: (requestId: string, driverId: string) => void
  submitRating: (ratingId: string, rating: NonNullable<PendingRating['rating']>) => void
}

function safeParsePersistedState(): PersistedState {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as PersistedState
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function persistState(next: PersistedState) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Local storage can be unavailable in restricted webviews.
  }
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export function buildLocationLabelUz(location: Pick<UserLocation, 'regionId' | 'districtId'>) {
  const region = getRegion(location.regionId)
  const district = location.districtId ? getDistrict(location.districtId) : null

  if (!region) return "Joylashuv noma'lum"
  if (region.id === 'toshkent') return 'Toshkent'
  if (district) return `${region.nameUz}, ${district.nameUz} tumani`

  return region.nameUz
}

function seedDrivers(): DriverProfile[] {
  return [
    {
      id: 'drv_1',
      name: 'Alisher B.',
      initials: 'AB',
      home: {
        regionId: 'samarkand',
        districtId: 'samarkand-juma',
        labelUz: 'Samarqand, Juma tumani',
        source: 'manual',
      },
      carModel: 'Chevrolet Cobalt',
      carYear: 2022,
      phone: '+998 90 123 45 67',
      verified: true,
      activeNow: true,
      badges: ['verified', 'clean', 'on_time'],
      rating: { avg: 4.8, trips: 47, onTimePct: 94, carPct: 88, mannersPct: 97 },
      reviews: ["Vaqtida keldi, mashina toza.", "Yo'lda yaxshi muomala qildi."],
    },
    {
      id: 'drv_2',
      name: 'Jasur M.',
      initials: 'JM',
      home: {
        regionId: 'samarkand',
        districtId: 'samarkand-juma',
        labelUz: 'Samarqand, Juma tumani',
        source: 'manual',
      },
      carModel: 'Chevrolet Gentra',
      carYear: 2020,
      phone: '+998 93 700 88 11',
      verified: true,
      activeNow: true,
      badges: ['verified', 'on_time'],
      rating: { avg: 4.6, trips: 19, onTimePct: 91, carPct: 84, mannersPct: 95 },
      reviews: ["Tez javob berdi.", "Narxni oldindan kelishib oldik."],
    },
    {
      id: 'drv_3',
      name: 'Dilshod K.',
      initials: 'DK',
      home: {
        regionId: 'samarkand',
        districtId: 'samarkand-urgut',
        labelUz: 'Samarqand, Urgut tumani',
        source: 'manual',
      },
      carModel: 'Nexia 3',
      carYear: 2019,
      phone: '+998 91 555 10 20',
      verified: true,
      activeNow: false,
      badges: ['verified', 'clean'],
      rating: { avg: 4.7, trips: 33, onTimePct: 89, carPct: 92, mannersPct: 96 },
      reviews: ["Oilaviy safar uchun qulay.", "Mashina saloni ozoda."],
    },
    {
      id: 'drv_4',
      name: 'Murodjon A.',
      initials: 'MA',
      home: {
        regionId: 'fargona',
        districtId: 'fargona-qoqon',
        labelUz: "Farg'ona, Qo'qon tumani",
        source: 'manual',
      },
      carModel: 'Lacetti',
      carYear: 2021,
      phone: '+998 97 214 14 14',
      verified: true,
      activeNow: true,
      badges: ['verified', 'clean', 'on_time'],
      rating: { avg: 4.9, trips: 61, onTimePct: 96, carPct: 93, mannersPct: 98 },
      reviews: ["Yo'lni yaxshi biladi.", "Safar tinch o'tdi."],
    },
  ]
}

function buildDemoApplications(request: PassengerRequest, drivers: DriverProfile[]): DriverApplication[] {
  const matchingDrivers = drivers.filter(
    (driver) =>
      driver.activeNow &&
      driver.home.regionId === request.origin.regionId &&
      driver.home.districtId === request.origin.districtId,
  )

  return matchingDrivers.slice(0, 3).map((driver, index) => ({
    id: uid('app'),
    requestId: request.id,
    driverId: driver.id,
    pricePerSeat: [65000, 60000, 70000][index] ?? 65000,
    departureWindowLabelUz: (['30 daqiqada', '1 soatda', 'Hozir'] as const)[index] ?? '30 daqiqada',
    note:
      index === 0
        ? "Juma markazidan chiqaman, old o'rindiq bo'sh."
        : "Yo'lga tayyorman, kelishilgan narxda olib ketaman.",
    createdAtISO: new Date(Date.now() + index * 1000).toISOString(),
  }))
}

export function createInitialState(): DriveeState {
  const persisted = safeParsePersistedState()
  const drivers = seedDrivers()

  return {
    ...persisted,
    drivers,
    driverRides: [],
    requests: [],
    pendingRatings: [
      {
        id: 'rate_1',
        tripLabelUz: 'Samarqand, Juma tumani -> Toshkent',
        driverId: 'drv_1',
        completedAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ],
  }
}

export function reduceState(state: DriveeState, action: { type: string; payload?: unknown }): DriveeState {
  switch (action.type) {
    case 'setRole': {
      const role = action.payload as UserRole
      const next = { ...state, role }
      persistState({ role: next.role, location: next.location, identity: next.identity })
      return next
    }
    case 'setIdentity': {
      const identity = action.payload as TelegramIdentity
      const next = { ...state, identity }
      persistState({ role: next.role, location: next.location, identity: next.identity })
      return next
    }
    case 'setLocation': {
      const location = action.payload as UserLocation
      const next = { ...state, location }
      persistState({ role: next.role, location: next.location, identity: next.identity })
      return next
    }
    case 'clearLocation': {
      const next = { ...state, location: undefined }
      persistState({ role: next.role, location: next.location, identity: next.identity })
      return next
    }
    case 'createPassengerRequest': {
      if (!state.location) return state

      const payload = action.payload as {
        destinationRegionId: PassengerRequest['destinationRegionId']
        dateISO: string
        timeApprox: string
        seats: number
        preferences: PassengerPreference[]
      }

      const requestBase: PassengerRequest = {
        id: uid('req'),
        passengerName: state.identity?.name || 'Siz',
        createdAtISO: new Date().toISOString(),
        origin: state.location,
        destinationRegionId: payload.destinationRegionId,
        dateISO: payload.dateISO,
        timeApprox: payload.timeApprox,
        seats: payload.seats,
        preferences: payload.preferences,
        applicants: [],
        status: 'active',
      }

      const request = {
        ...requestBase,
        applicants: buildDemoApplications(requestBase, state.drivers),
      }

      return { ...state, requests: [request, ...state.requests] }
    }
    case 'createDriverRide': {
      if (!state.location) return state

      const payload = action.payload as Omit<DriverRide, 'id' | 'driverId' | 'origin' | 'status' | 'createdAtISO'>
      const ride: DriverRide = {
        ...payload,
        id: uid('ride'),
        driverId: DEMO_DRIVER_ID,
        origin: state.location,
        status: 'live',
        createdAtISO: new Date().toISOString(),
      }

      return { ...state, driverRides: [ride, ...state.driverRides] }
    }
    case 'applyToRequestAsDriver': {
      const { requestId, payload } = action.payload as {
        requestId: string
        payload: Omit<DriverApplication, 'id' | 'createdAtISO' | 'requestId'>
      }

      return {
        ...state,
        requests: state.requests.map((request) => {
          if (request.id !== requestId || request.status !== 'active') return request
          if (request.applicants.some((app) => app.driverId === payload.driverId)) return request

          return {
            ...request,
            applicants: [
              ...request.applicants,
              {
                ...payload,
                id: uid('app'),
                requestId,
                createdAtISO: new Date().toISOString(),
              },
            ],
          }
        }),
      }
    }
    case 'selectDriverForRequest': {
      const { requestId, driverId } = action.payload as { requestId: string; driverId: string }

      return {
        ...state,
        requests: state.requests.map((request) =>
          request.id === requestId
            ? { ...request, selectedDriverId: driverId, status: 'confirmed' }
            : request,
        ),
      }
    }
    case 'submitRating': {
      const { ratingId, rating } = action.payload as {
        ratingId: string
        rating: NonNullable<PendingRating['rating']>
      }

      return {
        ...state,
        pendingRatings: state.pendingRatings.map((pending) =>
          pending.id === ratingId ? { ...pending, rating } : pending,
        ),
      }
    }
    default:
      return state
  }
}
