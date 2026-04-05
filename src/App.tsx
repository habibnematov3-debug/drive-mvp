import { useEffect, useState } from 'react'
import { mockUser, routeLabels } from './data/mock'
import AppLayout from './layout/AppLayout'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import OrdersScreen from './screens/OrdersScreen'
import ProfileScreen from './screens/ProfileScreen'
import type { Passenger, RequestFormData, RideRequest, TabKey } from './types/drivee'
import { getApiBaseUrl } from './utils/api'
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

function formatAuthError(error: unknown) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return "Server bilan bog'lanib bo'lmadi. Qayta urinib ko'ring."
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Telegram profilini yuklab bo'lmadi"
}

export default function App() {
  const [tab, setTab] = useState<TabKey>('home')
  const [orders, setOrders] = useState<RideRequest[]>([])
  const [passenger, setPassenger] = useState<Passenger | null>(null)
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [authError, setAuthError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

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
      setAuthError('VITE_API_BASE_URL sozlanmagan')
      return
    }

    if (!telegramUser?.id || !initData) {
      if (!isDevBypass) {
        setPassenger(null)
        setOrders([])
        setAuthState('telegram_required')
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
        throw new Error("Arizalar ro'yxatini yuklab bo'lmadi")
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
        throw new Error(result.error || "Arizalar ro'yxatini yuklab bo'lmadi")
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
            throw new Error("Telegram profilini tekshirib bo'lmadi")
          }

          const authResult = JSON.parse(authBody) as {
            success?: boolean
            error?: string
            user?: Parameters<typeof buildPassengerFromTelegram>[0]
          }

          if (!authResponse.ok || !authResult.success || !authResult.user?.id) {
            throw new Error(authResult.error || "Telegram profilini tekshirib bo'lmadi")
          }

          const nextPassenger = buildPassengerFromTelegram(authResult.user)
          setPassenger(nextPassenger)
          setAuthState('ready')
        }
      } catch (error) {
        if (controller.signal.aborted) return
        setPassenger(null)
        setOrders([])
        setAuthState('error')
        setAuthError(formatAuthError(error))
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
              : "Arizalar ro'yxatini yuklab bo'lmadi",
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
  }, [])

  useEffect(() => {
    if (!toast) return

    const timeoutId = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  function addOrder(request: RequestFormData, bookingId: string) {
    const nextOrder: RideRequest = {
      id: bookingId,
      routeId: request.routeId,
      routeLabel: routeLabels[request.routeId],
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

    showToast('VITE_TELEGRAM_BOT_URL sozlanmagan')
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
        headerSubtitle="Shaharlararo safar arizalari"
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
