import { useEffect, useState } from 'react'
import { initialRequests, mockUser, routeLabels } from './data/mock'
import AppLayout from './layout/AppLayout'
import HomeScreen from './screens/HomeScreen'
import OrdersScreen from './screens/OrdersScreen'
import ProfileScreen from './screens/ProfileScreen'
import type { RequestFormData, RideRequest, TabKey } from './types/drivee'

export default function App() {
  const [tab, setTab] = useState<TabKey>('home')
  const [orders, setOrders] = useState<RideRequest[]>(initialRequests)
  const [toast, setToast] = useState<string | null>(null)

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
          <OrdersScreen orders={orders} />
        ) : (
          <ProfileScreen
            passenger={mockUser}
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
