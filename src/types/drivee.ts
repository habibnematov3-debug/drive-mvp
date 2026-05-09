export type TabKey = 'home' | 'requests' | 'rating' | 'profile'

export type UserRole = 'driver' | 'passenger'

export type RegionId =
  | 'toshkent'
  | 'samarkand'
  | 'fargona'
  | 'buxoro'
  | 'namangan'
  | 'andijon'
  | 'qashqadaryo'

export type DistrictId = string

export type District = {
  id: DistrictId
  regionId: RegionId
  nameUz: string
}

export type Region = {
  id: RegionId
  nameUz: string
  mode: 'tuman_match' | 'zones'
  districts: District[]
}

export type UserLocation = {
  regionId: RegionId
  districtId?: DistrictId
  labelUz: string
  source: 'gps' | 'manual'
}

export type PassengerPreference =
  | 'front_seat'
  | 'non_smoking'
  | 'clean_car'
  | 'women_only'
  | 'ac'

export type DriverBadge = 'verified' | 'clean' | 'on_time'

export type DriverProfile = {
  id: string
  name: string
  initials: string
  home: UserLocation
  carModel: string
  carYear: number
  phone: string
  verified: boolean
  activeNow: boolean
  badges: DriverBadge[]
  rating: {
    avg: number
    trips: number
    onTimePct: number
    carPct: number
    mannersPct: number
  }
  reviews: string[]
}

export type DriverApplication = {
  id: string
  driverId: string
  requestId: string
  pricePerSeat: number
  departureWindowLabelUz: 'Hozir' | '30 daqiqada' | '1 soatda' | '2 soatda'
  note?: string
  createdAtISO: string
}

export type PassengerRequest = {
  id: string
  passengerName: string
  createdAtISO: string
  origin: UserLocation
  destinationRegionId: RegionId
  dateISO: string
  timeApprox: string
  seats: number
  preferences: PassengerPreference[]
  applicants: DriverApplication[]
  status: 'active' | 'confirmed' | 'cancelled' | 'completed'
  selectedDriverId?: string
}

export type DriverRide = {
  id: string
  driverId: string
  origin: UserLocation
  destinationRegionId: RegionId
  departureWindowLabelUz: DriverApplication['departureWindowLabelUz']
  seatsAvailable: number
  pricePerSeat: number
  frontSeatExtra: number
  smoking: 'no' | 'yes'
  note?: string
  status: 'live' | 'closed'
  createdAtISO: string
}

export type PendingRating = {
  id: string
  tripLabelUz: string
  driverId: string
  completedAtISO: string
  rating?: {
    stars: 1 | 2 | 3 | 4 | 5
    onTime: 1 | 2 | 3 | 4 | 5
    car: 1 | 2 | 3 | 4 | 5
    manners: 1 | 2 | 3 | 4 | 5
    comment?: string
  }
}

export type TelegramIdentity = {
  telegramUserId?: string
  name: string
  avatarUrl?: string
}

// Compatibility types for older components that are no longer routed.
export type RequestStatus = 'submitted' | 'matched' | 'cancelled' | 'completed'

export type RideRequest = {
  id: string
  routeId: string
  routeLabel: string
  dateISO: string
  time: string
  passengerCount: number
  fullCar?: boolean
  hasBag?: boolean
  status: RequestStatus | string
  driver?: {
    name?: string
    phone?: string
    carModel?: string
  }
}

export type RequestFormData = {
  routeId: string
  dateISO: string
  time: string
  passengerPhone: string
  passengerCount: number
  fullCar: boolean
  hasBag: boolean
  passengerGender?: string
  comment?: string
}

export type Passenger = {
  name: string
  secondaryLine: string
  languageLabel: string
  avatarUrl?: string
  telegramUserId: string
}
