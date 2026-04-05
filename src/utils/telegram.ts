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
  const secondaryLine =
    user.username
      ? `@${user.username}`
      : user.id
        ? `Telegram ID: ${user.id}`
        : ''

  return {
    name: name || 'Telegram user',
    secondaryLine,
    languageLabel:
      normalizeLanguageLabel(user.language_code) ?? '',
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
