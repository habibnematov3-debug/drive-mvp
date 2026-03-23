import type { Passenger } from '../types/drivee'

export type TelegramWebAppUser = {
  id?: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

type TelegramWebApp = {
  initDataUnsafe?: {
    user?: TelegramWebAppUser
  }
}

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp
  }
}

function normalizeLanguageLabel(languageCode?: string) {
  if (!languageCode) return undefined
  const normalized = languageCode.toLowerCase()

  if (normalized.startsWith('uz')) return "O'zbekcha"
  if (normalized.startsWith('ru')) return 'Русский'
  if (normalized.startsWith('en')) return 'English'

  return languageCode
}

export function getTelegramUser() {
  if (typeof window === 'undefined') return null
  return (window as TelegramWindow).Telegram?.WebApp?.initDataUnsafe?.user ?? null
}

export function formatTelegramDisplayName(user?: TelegramWebAppUser | null) {
  if (!user) return ''

  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()

  if (fullName) return fullName
  if (user.username) return `@${user.username}`
  if (user.id) return `Telegram ID: ${user.id}`

  return ''
}

export function buildPassengerFromTelegram(
  user: TelegramWebAppUser | null,
  fallbackPassenger: Passenger,
): Passenger {
  if (!user) {
    return fallbackPassenger
  }

  const name = formatTelegramDisplayName(user) || fallbackPassenger.name
  const secondaryLine =
    user.username
      ? `@${user.username}`
      : user.id
        ? `Telegram ID: ${user.id}`
        : fallbackPassenger.secondaryLine

  return {
    name,
    secondaryLine,
    languageLabel:
      normalizeLanguageLabel(user.language_code) ?? fallbackPassenger.languageLabel,
    avatarUrl: user.photo_url ?? fallbackPassenger.avatarUrl,
  }
}
