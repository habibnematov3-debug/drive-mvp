import { useEffect, useMemo, useState } from 'react'
import AppLayout from './layout/AppLayout'
import DriverHomeScreen from './screens/DriverHomeScreen'
import LocationConfirmScreen from './screens/LocationConfirmScreen'
import PassengerHomeScreen from './screens/PassengerHomeScreen'
import ProfileScreen from './screens/ProfileScreen'
import RatingScreen from './screens/RatingScreen'
import RequestsScreen from './screens/RequestsScreen'
import RolePickerScreen from './screens/RolePickerScreen'
import { useDrivee } from './contexts/DriveeContext'
import type { PassengerPreference, RegionId, TabKey } from './types/drivee'
import { getTelegramUser, getTelegramWebApp } from './utils/telegram'

export default function App() {
  const { state, actions } = useDrivee()
  const [tab, setTab] = useState<TabKey>('home')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const webApp = getTelegramWebApp()
    webApp?.ready?.()
    webApp?.expand?.()

    const user = getTelegramUser()
    if (user?.id || user?.first_name || user?.username) {
      actions.setIdentity({
        telegramUserId: user.id ? String(user.id) : undefined,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ') || (user.username ? `@${user.username}` : 'Telegram user'),
        avatarUrl: user.photo_url,
      })
    }
  }, [actions])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(id)
  }, [toast])

  const headerSubtitle = useMemo(() => {
    if (tab === 'home') return state.role === 'driver' ? 'Haydovchi rejimi' : "Yo'lovchi rejimi"
    if (tab === 'requests') return state.role === 'driver' ? "Kelayotgan so'rovlar" : 'Arizalar va haydovchilar'
    if (tab === 'rating') return 'Safarlarni baholash'
    return 'Profil va sozlamalar'
  }, [state.role, tab])

  if (!state.role) return <RolePickerScreen />
  if (!state.location) return <LocationConfirmScreen />

  function createPassengerRequest(payload: {
    destinationRegionId: RegionId
    dateISO: string
    timeApprox: string
    seats: number
    preferences: PassengerPreference[]
  }) {
    actions.createPassengerRequest(payload)
    setToast("So'rov yuborildi")
  }

  return (
    <AppLayout activeTab={tab} onTabChange={setTab} headerTitle="Drivee" headerSubtitle={headerSubtitle}>
      {tab === 'home' ? (
        state.role === 'driver' ? (
          <DriverHomeScreen />
        ) : (
          <PassengerHomeScreen onCreate={createPassengerRequest} />
        )
      ) : tab === 'requests' ? (
        <RequestsScreen />
      ) : tab === 'rating' ? (
        <RatingScreen />
      ) : (
        <ProfileScreen />
      )}

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div className="rounded-lg bg-brand-ink px-4 py-2 text-sm font-semibold text-white shadow-soft">
            {toast}
          </div>
        </div>
      ) : null}
    </AppLayout>
  )
}
