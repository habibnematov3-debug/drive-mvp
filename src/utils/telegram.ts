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
  initData?: string
  initDataUnsafe?: {
    user?: TelegramWebAppUser
  }
  ready?: () => void
  expand?: () => void
  close?: () => void
  openTelegramLink?: (url: string) => void
  requestLocation?: (callback: (location: unknown) => void) => void
  HapticFeedback?: {
    impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred?: (type: 'error' | 'success' | 'warning') => void
    selectionChanged?: () => void
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

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null
  return (window as TelegramWindow).Telegram?.WebApp ?? null
}

export function getTelegramInitData() {
  return getTelegramWebApp()?.initData?.trim() || ''
}

export function buildTelegramAuthHeaders(devTelegramUserId?: string) {
  const headers: Record<string, string> = {}
  const initData = getTelegramInitData()

  if (initData) {
    headers['X-Telegram-Init-Data'] = initData
    return headers
  }

  if (import.meta.env.DEV && devTelegramUserId) {
    headers['X-Drivee-Dev-User-Id'] = devTelegramUserId
  }

  return headers
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
): Passenger {
  if (!user) {
    return {
      name: '',
      secondaryLine: '',
      languageLabel: '',
      telegramUserId: '',
    }
  }

  const name = formatTelegramDisplayName(user)
  const secondaryLine = user.username
    ? `@${user.username}`
    : user.id
      ? `Telegram ID: ${user.id}`
      : ''

  return {
    name: name || 'Telegram user',
    secondaryLine,
    languageLabel: normalizeLanguageLabel(user.language_code) ?? '',
    avatarUrl: user.photo_url,
    telegramUserId: user.id ? String(user.id) : '',
  }
}

export function closeTelegramMiniApp() {
  getTelegramWebApp()?.close?.()
}

export function openTelegramUrl(url: string) {
  const webApp = getTelegramWebApp()

  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(url)
    return
  }

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export type TelegramLocation = {
  latitude?: number
  longitude?: number
}

export function requestTelegramLocation(): Promise<TelegramLocation> {
  const webApp = getTelegramWebApp()

  return new Promise((resolve, reject) => {
    if (!webApp?.requestLocation) {
      reject(new Error("GPS ishlamadi. Tumaningizni qo'lda tanlang."))
      return
    }

    try {
      webApp.requestLocation((location) => {
        const obj = location as TelegramLocation | null
        const latitude = obj?.latitude
        const longitude = obj?.longitude

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          reject(new Error("GPS ma'lumoti olinmadi. Tumaningizni qo'lda tanlang."))
          return
        }

        resolve({ latitude, longitude })
      })
    } catch (error) {
      reject(error instanceof Error ? error : new Error("GPS ishlamadi. Qayta urinib ko'ring."))
    }
  })
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
  getTelegramWebApp()?.HapticFeedback?.impactOccurred?.(style)
}

export function hapticSelection() {
  getTelegramWebApp()?.HapticFeedback?.selectionChanged?.()
}

export function hapticNotify(type: 'error' | 'success' | 'warning') {
  getTelegramWebApp()?.HapticFeedback?.notificationOccurred?.(type)
}
