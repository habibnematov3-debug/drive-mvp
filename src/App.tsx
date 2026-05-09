import AppLayout from './layout/AppLayout'
import ProfileScreen from './screens/ProfileScreen'
import { useEffect, useMemo, useState } from 'react'
import type { PassengerPreference, TabKey } from './types/drivee'
import { useDrivee } from './contexts/DriveeContext'
import RolePickerScreen from './screens/RolePickerScreen'
import LocationConfirmScreen from './screens/LocationConfirmScreen'
import PassengerHomeScreen from './screens/PassengerHomeScreen'
import DriverHomeScreen from './screens/DriverHomeScreen'
import RequestsScreen from './screens/RequestsScreen'
import RatingScreen from './screens/RatingScreen'
import { getTelegramUser, getTelegramWebApp } from './utils/telegram'
import { buildLocationLabelUz } from './state/driveeStore'

export default function App() {
  const { state, actions } = useDrivee()
  const [tab, setTab] = useState<TabKey>('home')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const webApp = getTelegramWebApp()
    webApp?.ready?.()
    webApp?.expand?.()

    const user = getTelegramUser()
    if (user?.id && (user.first_name || user.username)) {
      actions.setIdentity({
        telegramUserId: String(user.id),
        name: [user.first_name, user.last_name].filter(Boolean).join(' ') || `@${user.username ?? ''}`.trim(),
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
    if (tab === 'requests') return 'Arizalar va so‘rovlar'
    if (tab === 'rating') return 'Baholash'
    return 'Profil'
  }, [state.role, tab])

  if (!state.role) {
    return (
      <div className="min-h-screen bg-brand-bg px-4">
        <RolePickerScreen />
      </div>
    )
  }

  if (!state.location) {
    return (
      <div className="min-h-screen bg-brand-bg px-4">
        <LocationConfirmScreen />
      </div>
    )
  }

  const createPassengerRequest = (payload: {
    destinationRegionId: string
    dateISO: string
    timeApprox: string
    seats: number
    preferences: PassengerPreference[]
  }) => {
    // reducer will update state; we show a small toast
    actions.createPassengerRequest(payload as never)
    setToast('So‘rov yuborildi ✅')
  }

  return (
    <AppLayout
      activeTab={tab}
      onTabChange={setTab}
      headerTitle="Drivee"
      headerSubtitle={headerSubtitle}
    >
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
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center">
          <div className="rounded-[20px] bg-brand-ink px-4 py-2 text-sm font-semibold text-white shadow-soft">
            {toast}
          </div>
        </div>
      ) : null}
    </AppLayout>
  )
}
