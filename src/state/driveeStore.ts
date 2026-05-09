import type {
  DriverApplication,
  DriverProfile,
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

const STORAGE_KEY = 'drivee-mvp-state-v1'

export type DriveeState = PersistedState & {
  requests: PassengerRequest[]
  drivers: DriverProfile[]
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
    // ignore
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
  return `${region.nameUz}`
}

export function createInitialState(): DriveeState {
  const persisted = safeParsePersistedState()

  const drivers: DriverProfile[] = [
    {
      id: 'drv_1',
      name: 'Alisher B.',
      home: {
        regionId: 'samarkand',
        districtId: 'samarkand-juma',
        labelUz: 'Samarqand, Juma tumani',
        source: 'manual',
      },
      carModel: 'Cobalt',
      carYear: 2022,
      verified: true,
      badges: ['verified', 'clean', 'on_time'],
      rating: { avg: 4.8, trips: 47, onTimePct: 94, carPct: 88, mannersPct: 97 },
    },
    {
      id: 'drv_2',
      name: 'Jasur M.',
      home: {
        regionId: 'samarkand',
        districtId: 'samarkand-juma',
        labelUz: 'Samarqand, Juma tumani',
        source: 'manual',
      },
      carModel: 'Gentra',
      carYear: 2020,
      verified: true,
      badges: ['verified', 'on_time'],
      rating: { avg: 4.6, trips: 19, onTimePct: 91, carPct: 84, mannersPct: 95 },
    },
    {
      id: 'drv_3',
      name: 'Dilshod K.',
      home: {
        regionId: 'fargona',
        districtId: 'fargona-qoqon',
        labelUz: "Farg'ona, Qo'qon tumani",
        source: 'manual',
      },
      carModel: 'Nexia 3',
      carYear: 2019,
      verified: true,
      badges: ['verified', 'clean'],
      rating: { avg: 4.7, trips: 33, onTimePct: 89, carPct: 92, mannersPct: 96 },
    },
  ]

  const pendingRatings: PendingRating[] = [
    {
      id: 'rate_1',
      tripLabelUz: 'Samarqand → Toshkent',
      driverId: 'drv_1',
      completedAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ]

  return {
    ...persisted,
    requests: [],
    drivers,
    pendingRatings,
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
      const payload = action.payload as {
        destinationRegionId: PassengerRequest['destinationRegionId']
        dateISO: string
        timeApprox: string
        seats: number
        preferences: PassengerPreference[]
      }

      if (!state.location) return state

      const request: PassengerRequest = {
        id: uid('req'),
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

      return { ...state, requests: [request, ...state.requests] }
    }
    case 'applyToRequestAsDriver': {
      const { requestId, payload } = action.payload as {
        requestId: string
        payload: Omit<DriverApplication, 'id' | 'createdAtISO' | 'requestId'>
      }
      const nextRequests = state.requests.map((r) => {
        if (r.id !== requestId) return r
        if (r.status !== 'active') return r

        const alreadyApplied = r.applicants.some((a) => a.driverId === payload.driverId)
        if (alreadyApplied) return r

        const app: DriverApplication = {
          id: uid('app'),
          requestId,
          createdAtISO: new Date().toISOString(),
          ...payload,
        }

        return { ...r, applicants: [...r.applicants, app] }
      })
      return { ...state, requests: nextRequests }
    }
    case 'selectDriverForRequest': {
      const { requestId, driverId } = action.payload as { requestId: string; driverId: string }
      const nextRequests = state.requests.map((r) => {
        if (r.id !== requestId) return r
        return { ...r, status: 'confirmed', selectedDriverId: driverId }
      })
      return { ...state, requests: nextRequests }
    }
    case 'submitRating': {
      const { ratingId, rating } = action.payload as {
        ratingId: string
        rating: NonNullable<PendingRating['rating']>
      }
      return {
        ...state,
        pendingRatings: state.pendingRatings.map((p) =>
          p.id === ratingId ? { ...p, rating } : p,
        ),
      }
    }
    default:
      return state
  }
}

