import { useEffect, useState } from 'react'
import { mockUser } from './data/mock'
import AppLayout from './layout/AppLayout'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import OrdersScreen from './screens/OrdersScreen'
import ProfileScreen from './screens/ProfileScreen'
import type { Passenger, RequestFormData, RideRequest, TabKey } from './types/drivee'
import { getApiBaseUrl } from './utils/api'
import { useLanguage } from './contexts/LanguageContext'
import {
  buildTelegramAuthHeaders,
  buildPassengerFromTelegram,
  closeTelegramMiniApp,
  getTelegramInitData,
  getTelegramUser,
  getTelegramWebApp,
  openTelegramUrl,
} from './utils/telegram'

type AuthState = 'loading' | 'ready' | 'telegram_required' | 'error'

function isNetworkFetchError(error: unknown) {
  if (!(error instanceof Error)) return false

  const normalized = error.message.toLowerCase()
  return (
    error instanceof TypeError ||
    normalized.includes('failed to fetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('network request failed') ||
    normalized.includes('load failed')
  )
}

export default function App() {
  const { t } = useLanguage()
  const [tab, setTab] = useState<TabKey>('home')
  const [orders, setOrders] = useState<RideRequest[]>([])
  const [passenger, setPassenger] = useState<Passenger | null>(null)
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [authError, setAuthError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const headerSubtitle =
    tab === 'home'
      ? t('header.homeSubtitle')
      : tab === 'orders'
        ? t('header.ordersSubtitle')
        : t('header.profileSubtitle')

  const getRouteLabel = (routeId: RequestFormData['routeId']) =>
    routeId === 'kokand-tashkent'
      ? t('routes.kokandTashkent')
      : t('routes.tashkentKokand')

  useEffect(() => {
    const webApp = getTelegramWebApp()
    webApp?.ready?.()
    webApp?.expand?.()

    const telegramUser = getTelegramUser()
    const initData = getTelegramInitData()
    const isDevBypass = import.meta.env.DEV && (!telegramUser?.id || !initData)
    const apiBaseUrl = getApiBaseUrl()

    if (!apiBaseUrl) {
      setPassenger(null)
      setAuthState('error')
      setAuthError(t('auth.connectionError'))
      return
    }

    if (!telegramUser?.id || !initData) {
      if (!isDevBypass) {
        setPassenger(null)
        setOrders([])
        setAuthState('telegram_required')
        setAuthError(null)
        setIsOrdersLoading(false)
        return
      }
    }

    const controller = new AbortController()

    async function loadOrders(devTelegramUserId?: string) {
      const requestsResponse = await fetch(`${apiBaseUrl}/requests`, {
        signal: controller.signal,
        headers: buildTelegramAuthHeaders(devTelegramUserId),
      })
      const responseBody = await requestsResponse.text()
      const contentType = requestsResponse.headers.get('content-type') ?? ''

      if (!contentType.includes('application/json')) {
        throw new Error(t('orders.loading'))
      }

      const result = JSON.parse(responseBody) as {
        success?: boolean
        error?: string
        requests?: RideRequest[]
      }

      if (
        !requestsResponse.ok ||
        !result.success ||
        !Array.isArray(result.requests)
      ) {
        throw new Error(result.error || t('orders.loading'))
      }

      setOrders(result.requests)
    }

    async function bootstrap() {
      setAuthState('loading')
      setAuthError(null)
      setOrders([])
      setPassenger(null)
      setIsOrdersLoading(false)

      try {
        if (isDevBypass) {
          setPassenger(mockUser)
          setAuthState('ready')
        } else {
          const authResponse = await fetch(`${apiBaseUrl}/auth/telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
            signal: controller.signal,
          })
          const authBody = await authResponse.text()
          const authContentType = authResponse.headers.get('content-type') ?? ''

          if (!authContentType.includes('application/json')) {
            throw new Error(t('auth.failedToLoadProfile'))
          }

          const authResult = JSON.parse(authBody) as {
            success?: boolean
            error?: string
            user?: Parameters<typeof buildPassengerFromTelegram>[0]
          }

          if (!authResponse.ok || !authResult.success || !authResult.user?.id) {
            throw new Error(authResult.error || t('auth.failedToLoadProfile'))
          }

          const nextPassenger = buildPassengerFromTelegram(authResult.user)
          setPassenger(nextPassenger)
          setAuthState('ready')
        }
      } catch (error) {
        if (controller.signal.aborted) return
        const nextAuthError =
          isNetworkFetchError(error)
            ? t('auth.connectionError')
            : error instanceof Error
              ? error.message
              : t('auth.failedToLoadProfile')
        setPassenger(null)
        setOrders([])
        setAuthState('error')
        setAuthError(nextAuthError)
        return
      }

      setIsOrdersLoading(true)
      try {
        await loadOrders(isDevBypass ? mockUser.telegramUserId : undefined)
      } catch (ordersError) {
        if (!controller.signal.aborted) {
          setOrders([])
          setToast(
            ordersError instanceof Error
              ? ordersError.message
              : t('orders.loading'),
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsOrdersLoading(false)
        }
      }
    }

    bootstrap()

    return () => controller.abort()
  }, [t])

  useEffect(() => {
    if (!toast) return

    const timeoutId = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  function addOrder(request: RequestFormData, bookingId: string) {
    const nextOrder: RideRequest = {
      id: bookingId,
      routeId: request.routeId,
      routeLabel: getRouteLabel(request.routeId),
      dateISO: request.dateISO,
      time: request.time,
      passengerPhone: request.passengerPhone,
      passengerCount: request.passengerCount,
      fullCar: request.fullCar,
      passengerGender: request.passengerGender,
      hasBag: request.hasBag,
      status: 'submitted',
      comment: request.comment,
      createdAtISO: new Date().toISOString(),
    }

    setOrders((prev) => [nextOrder, ...prev])
  }

  function showToast(message: string) {
    setToast(message)
  }

  function handleSupport() {
    const supportUrl = import.meta.env.VITE_TELEGRAM_BOT_URL?.trim()

    if (supportUrl) {
      openTelegramUrl(supportUrl)
      return
    }

    showToast('VITE_TELEGRAM_BOT_URL is not configured')
  }

  function handleLogout() {
    closeTelegramMiniApp()
  }

  return (
    <>
      <AppLayout
        activeTab={tab}
        onTabChange={setTab}
        headerTitle="Drivee"
        headerSubtitle={headerSubtitle}
      >
        {authState !== 'ready' || !passenger ? (
          <AuthScreen
            authState={authState}
            errorMessage={authError}
            canOpenTelegram={
              authState === 'telegram_required' &&
              Boolean(import.meta.env.VITE_TELEGRAM_BOT_URL?.trim())
            }
            onOpenTelegram={() => {
              const supportUrl = import.meta.env.VITE_TELEGRAM_BOT_URL?.trim()
              if (supportUrl) {
                openTelegramUrl(supportUrl)
              }
            }}
            onRetry={() => window.location.reload()}
          />
        ) : tab === 'home' ? (
          <HomeScreen
            onSubmitRequest={addOrder}
            passengerName={passenger.name}
            telegramUserId={passenger.telegramUserId}
          />
        ) : tab === 'orders' ? (
          <OrdersScreen orders={orders} isLoading={isOrdersLoading} />
        ) : (
          <ProfileScreen
            passenger={passenger}
            onLogout={handleLogout}
            onSupport={handleSupport}
          />
        )}
      </AppLayout>

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center">
          <div className="rounded-[20px] bg-brand-ink px-4 py-2 text-sm text-white shadow-soft">
            {toast}
          </div>
        </div>
      ) : null}
    </>
  )
}
