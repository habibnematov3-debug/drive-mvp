import { useCallback, useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeLabels } from './data/mock'
import AppLayout from './layout/AppLayout'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import OrdersScreen from './screens/OrdersScreen'
import ProfileScreen from './screens/ProfileScreen'
import type { Passenger, RequestFormData, RideRequest, TabKey } from './types/drivee'
import { getApiBaseUrl } from './utils/api'
import { fetchWithRetry } from './utils/network'
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
type OrderActionResult = { ok: true } | { ok: false; error: string }
const SUPPORT_TELEGRAM_URL = 'https://t.me/drivee_inc'

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

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

export default function App() {
  const { t } = useLanguage()
  const [tab, setTab] = useState<TabKey>('home')
  const [orders, setOrders] = useState<RideRequest[]>([])
  const [passenger, setPassenger] = useState<Passenger | null>(null)
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)
  const [isOrdersRefreshing, setIsOrdersRefreshing] = useState(false)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [authError, setAuthError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const headerSubtitle =
    tab === 'home'
      ? t('header.homeSubtitle')
      : tab === 'orders'
        ? t('header.ordersSubtitle')
        : t('header.profileSubtitle')

  const loadOrders = useCallback(
    async ({
      signal,
      telegramUserId,
    }: {
      signal?: AbortSignal
      telegramUserId?: string
    } = {}) => {
      const apiBaseUrl = getApiBaseUrl()

      if (!apiBaseUrl) {
        throw new Error(t('auth.connectionError'))
      }

      const requestsResponse = await fetchWithRetry(
        `${apiBaseUrl}/requests`,
        {
          signal,
          headers: buildTelegramAuthHeaders(telegramUserId),
        },
        {
          retries: 2,
          timeoutMs: 20_000,
          initialDelayMs: 1_100,
        },
      )
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

      return result.requests
    },
    [t],
  )

  const refreshOrders = useCallback(
    async ({
      signal,
      silent = false,
      telegramUserId,
    }: {
      signal?: AbortSignal
      silent?: boolean
      telegramUserId?: string
    } = {}): Promise<OrderActionResult> => {
      if (silent) {
        setIsOrdersRefreshing(true)
      } else {
        setIsOrdersLoading(true)
      }

      try {
        const nextOrders = await loadOrders({ signal, telegramUserId })

        if (!signal?.aborted) {
          setOrders(nextOrders)
        }

        return { ok: true }
      } catch (error) {
        if (signal?.aborted) {
          return { ok: false, error: t('orders.loading') }
        }

        const errorMessage =
          error instanceof Error ? error.message : t('orders.loading')
        setToast(errorMessage)
        return { ok: false, error: errorMessage }
      } finally {
        if (!signal?.aborted) {
          if (silent) {
            setIsOrdersRefreshing(false)
          } else {
            setIsOrdersLoading(false)
          }
        }
      }
    },
    [loadOrders, t],
  )

  useEffect(() => {
    const webApp = getTelegramWebApp()
    webApp?.ready?.()
    webApp?.expand?.()

    const telegramUser = getTelegramUser()
    const initData = getTelegramInitData()
    const apiBaseUrl = getApiBaseUrl()

    if (!apiBaseUrl) {
      setPassenger(null)
      setAuthState('error')
      setAuthError(t('auth.connectionError'))
      return
    }

    if (!telegramUser?.id || !initData) {
      setPassenger(null)
      setOrders([])
      setAuthState('telegram_required')
      setAuthError(t('auth.telegramLogin'))
      return
    }

    const controller = new AbortController()

    async function warmUpBackend() {
      const healthResponse = await fetchWithRetry(
        `${apiBaseUrl}/health`,
        {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        },
        {
          retries: 3,
          timeoutMs: 20_000,
          initialDelayMs: 1_400,
        },
      )

      const contentType = healthResponse.headers.get('content-type') ?? ''
      if (!healthResponse.ok || !contentType.includes('application/json')) {
        throw new Error(t('auth.connectionError'))
      }
    }

    async function bootstrap() {
      setAuthState('loading')
      setAuthError(null)
      setOrders([])
      setPassenger(null)
      setIsOrdersLoading(false)
      setIsOrdersRefreshing(false)

      try {
        await warmUpBackend()

        const authResponse = await fetchWithRetry(
          `${apiBaseUrl}/auth/telegram`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
            signal: controller.signal,
          },
          {
            retries: 2,
            timeoutMs: 20_000,
            initialDelayMs: 1_100,
          },
        )
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

        await refreshOrders({
          signal: controller.signal,
          telegramUserId: nextPassenger.telegramUserId,
        })
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
    }

    bootstrap()

    return () => controller.abort()
  }, [refreshOrders, t])

  useEffect(() => {
    if (!toast) return

    const timeoutId = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    if (authState !== 'ready' || !passenger?.telegramUserId) {
      return
    }

    const intervalId = window.setInterval(() => {
      void refreshOrders({
        silent: true,
        telegramUserId: passenger.telegramUserId,
      })
    }, 30_000)

    return () => window.clearInterval(intervalId)
  }, [authState, passenger?.telegramUserId, refreshOrders])

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

  const handleRefreshOrders = useCallback(() => {
    return refreshOrders({
      silent: true,
      telegramUserId: passenger?.telegramUserId,
    })
  }, [passenger?.telegramUserId, refreshOrders])

  const handleCancelOrder = useCallback(
    async (bookingId: string): Promise<OrderActionResult> => {
      const apiBaseUrl = getApiBaseUrl()

      if (!apiBaseUrl) {
        const error = t('auth.connectionError')
        setToast(error)
        return { ok: false, error }
      }

      try {
        const response = await fetch(
          `${apiBaseUrl}/bookings/${encodeURIComponent(bookingId)}`,
          {
            method: 'DELETE',
            headers: buildTelegramAuthHeaders(passenger?.telegramUserId),
          },
        )

        const responseBody = await response.text()
        const contentType = response.headers.get('content-type') ?? ''
        const statusLabel = `${response.status} ${response.statusText}`.trim()

        if (!contentType.includes('application/json')) {
          throw new Error(
            `API noto'g'ri javob qaytardi (${statusLabel}): ${responseBody}`,
          )
        }

        const result = JSON.parse(responseBody) as {
          success?: boolean
          error?: string
          message?: string
        }

        if (!response.ok || !result.success) {
          const error = result.error || `So'rov bajarilmadi (${statusLabel})`
          setToast(error)
          return { ok: false, error }
        }

        setOrders((prev) =>
          prev.map((order) =>
            order.id === bookingId
              ? {
                  ...order,
                  status: 'cancelled',
                }
              : order,
          ),
        )

        setToast(result.message || 'Ariza bekor qilindi')
        return { ok: true }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Arizani bekor qilib bo'lmadi"
        setToast(errorMessage)
        return { ok: false, error: errorMessage }
      }
    },
    [passenger?.telegramUserId, t],
  )

  function handleSupport() {
    openTelegramUrl(SUPPORT_TELEGRAM_URL)
  }

  function handleLogout() {
    closeTelegramMiniApp()
  }

  return (
    <QueryClientProvider client={queryClient}>
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
              true
            }
            onOpenTelegram={() => {
              openTelegramUrl(SUPPORT_TELEGRAM_URL)
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
          <OrdersScreen
            orders={orders}
            isLoading={isOrdersLoading}
            isRefreshing={isOrdersRefreshing}
            onCancelOrder={handleCancelOrder}
            onRefreshOrders={handleRefreshOrders}
          />
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
    </QueryClientProvider>
  )
}
