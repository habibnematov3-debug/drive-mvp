import type { Passenger, RouteId } from '../types/drivee'

export const routeLabels: Record<RouteId, string> = {
  'kokand-tashkent': 'Kokand → Tashkent',
  'tashkent-kokand': 'Tashkent → Kokand',
}

export const mockUser: Passenger = {
  name: 'Madina Karimova',
  secondaryLine: '+998 90 123-45-67',
  languageLabel: "O'zbekcha",
}
