import type { Passenger, RouteId } from '../types/drivee'

export const routeLabels: Record<RouteId, string> = {
  'kokand-tashkent': 'Kokand → Tashkent',
  'tashkent-kokand': 'Tashkent → Kokand',
}

export const mockUser: Passenger = {
  name: 'Local Test User',
  secondaryLine: 'Browser development mode',
  languageLabel: "O'zbekcha",
  telegramUserId: 'dev-local-user',
}
