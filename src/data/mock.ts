import type { RouteId } from '../types/drivee'

export const routeLabels: Record<RouteId, string> = {
  'kokand-tashkent': 'Kokand → Tashkent',
  'tashkent-kokand': 'Tashkent → Kokand',
  'tashkent-samarkand': 'Tashkent → Samarkand',
  'samarkand-tashkent': 'Samarkand → Tashkent',
  'tashkent-namangan': 'Tashkent → Namangan',
  'namangan-tashkent': 'Namangan → Tashkent',
}

// NOTE: mockUser removed for production - use only Telegram authentication
