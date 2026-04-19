import type { Passenger, RouteId } from '../types/drivee'

export const routeLabels: Record<RouteId, string> = {
  'kokand-tashkent': 'Kokand → Tashkent',
  'tashkent-kokand': 'Tashkent → Kokand',
  'tashkent-samarkand': 'Tashkent → Samarkand',
  'samarkand-tashkent': 'Samarkand → Tashkent',
  'tashkent-namangan': 'Tashkent → Namangan',
  'namangan-tashkent': 'Namangan → Tashkent',
}

export const mockUser: Passenger = {
  name: 'Local Test User',
  secondaryLine: 'Browser development mode',
  languageLabel: "O'zbekcha",
  telegramUserId: 'dev-local-user',
}
