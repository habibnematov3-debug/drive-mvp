import { useEffect, useState } from 'react'
import { mockUser, routeLabels } from './data/mock'
import AppLayout from './layout/AppLayout'
import HomeScreen from './screens/HomeScreen'
import OrdersScreen from './screens/OrdersScreen'
import ProfileScreen from './screens/ProfileScreen'
import type { Passenger, RequestFormData, RideRequest, TabKey } from './types/drivee'
import { buildPassengerFromTelegram, getTelegramUser } from './utils/telegram'

export default function App() {
  const [tab, setTab] = useState<TabKey>('home')
  const [orders, setOrders] = useState<RideRequest[]>([])
  const [passenger, setPassenger] = useState<Passenger>(mockUser)
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const telegramUser = getTelegramUser()
    setPassenger(buildPassengerFromTelegram(telegramUser, mockUser))

    if (!telegramUser?.id) {
      setOrders([])
      return
    }

    const telegramUserId = telegramUser.id

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')

    if (!apiBaseUrl) {
      showToast('VITE_API_BASE_URL sozlanmagan')
      return
    }

    const controller = new AbortController()

    async function loadOrders() {
      setIsOrdersLoading(true)

      try {
        const response = await fetch(
          `${apiBaseUrl}/requests?telegram_user_id=${telegramUserId}`,
          { signal: controller.signal },
        )
        const responseBody = await response.text()
        const contentType = response.headers.get('content-type') ?? ''

        if (!contentType.includes('application/json')) {
          throw new Error('Arizalar ro‘yxatini yuklab bo‘lmadi')
        }

        const result = JSON.parse(responseBody) as {
          success?: boolean
          error?: string
          requests?: RideRequest[]
        }

        if (!response.ok || !result.success || !Array.isArray(result.requests)) {
          throw new Error(result.error || 'Arizalar ro‘yxatini yuklab bo‘lmadi')
        }

        setOrders(result.requests)
      } catch (error) {
        if (controller.signal.aborted) return
        setOrders([])
        showToast(
          error instanceof Error
            ? error.message
            : 'Arizalar ro‘yxatini yuklab bo‘lmadi',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsOrdersLoading(false)
        }
      }
    }

    loadOrders()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!toast) return

    const timeoutId = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  function addOrder(request: RequestFormData) {
    const nextOrder: RideRequest = {
      id: `AR-${Date.now()}`,
      routeId: request.routeId,
      routeLabel: routeLabels[request.routeId],
      dateISO: request.dateISO,
      time: request.time,
      passengerCount: request.passengerCount,
      fullCar: request.fullCar,
      passengerGender: request.passengerGender,
      status: 'submitted',
      comment: request.comment,
      createdAtISO: new Date().toISOString(),
    }

    setOrders((prev) => [nextOrder, ...prev])
  }

  function showToast(message: string) {
    setToast(message)
  }

  return (
    <>
      <AppLayout
        activeTab={tab}
        onTabChange={setTab}
        headerTitle="Drivee"
        headerSubtitle="Shaharlararo safar arizalari"
      >
        {tab === 'home' ? (
          <HomeScreen onSubmitRequest={addOrder} />
        ) : tab === 'orders' ? (
          <OrdersScreen orders={orders} isLoading={isOrdersLoading} />
        ) : (
          <ProfileScreen
            passenger={passenger}
            onLogout={() => showToast("Demo rejimida chiqish o'chirilgan")}
            onSupport={() => showToast("Operator tez orada siz bilan bog'lanadi")}
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
