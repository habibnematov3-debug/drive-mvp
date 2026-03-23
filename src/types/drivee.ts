export type RouteId = 'kokand-tashkent' | 'tashkent-kokand'

export type TabKey = 'home' | 'orders' | 'profile'

export type RequestStatus = 'submitted' | 'matched' | 'cancelled'

export type PassengerGender = 'any' | 'male' | 'female'

export interface RideRequest {
  id: string
  routeId: RouteId
  routeLabel: string
  dateISO: string
  time: string
  passengerCount: number
  fullCar: boolean
  passengerGender: PassengerGender
  status: RequestStatus
  comment?: string
  createdAtISO: string
}

export interface RequestFormData {
  routeId: RouteId
  dateISO: string
  time: string
  passengerCount: number
  fullCar: boolean
  passengerGender: PassengerGender
  comment?: string
}

export interface Passenger {
  name: string
  phone: string
  languageLabel: string
}
