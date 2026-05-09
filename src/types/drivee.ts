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
  districts: District[]
  mode: 'tuman_match' | 'zones'
}

export type UserLocation = {
  regionId: RegionId
  districtId?: DistrictId
  labelUz: string // "Samarqand, Juma tumani"
  source: 'gps' | 'manual'
}

export type PassengerPreference =
  | 'front_seat'
  | 'non_smoking'
  | 'clean_car'
  | 'women_only'
  | 'ac'

export type PassengerRequest = {
  id: string
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

export type DriverProfile = {
  id: string
  name: string
  home: UserLocation
  carModel: string
  carYear: number
  verified: boolean
  badges: Array<'verified' | 'clean' | 'on_time'>
  rating: {
    avg: number
    trips: number
    onTimePct: number
    carPct: number
    mannersPct: number
  }
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
