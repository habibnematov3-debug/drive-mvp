export type RouteId =
  | 'kokand-tashkent'
  | 'tashkent-kokand'
  | 'tashkent-samarkand'
  | 'samarkand-tashkent'
  | 'tashkent-namangan'
  | 'namangan-tashkent'

export type TabKey = 'home' | 'orders' | 'profile'

export type RequestStatus = 'submitted' | 'matched' | 'cancelled'

export type PassengerGender = 'any' | 'male' | 'female'

export interface RideRequest {
  id: string
  routeId: RouteId
  routeLabel: string
  dateISO: string
  time: string
  passengerPhone?: string
  passengerCount: number
  fullCar: boolean
  passengerGender: PassengerGender
  hasBag?: boolean
  status: RequestStatus
  comment?: string
  createdAtISO: string
}

export interface RequestFormData {
  routeId: RouteId
  dateISO: string
  time: string
  passengerPhone: string
  passengerCount: number
  fullCar: boolean
  passengerGender: PassengerGender
  hasBag: boolean
  comment?: string
}

export interface Passenger {
  name: string
  secondaryLine: string
  languageLabel: string
  avatarUrl?: string
  telegramUserId?: string
}
