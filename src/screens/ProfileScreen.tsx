import { MapPin, Repeat2, Star, UserRound } from 'lucide-react'
import { Card, PrimaryButton, SecondaryButton } from '../components/ui'
import { useDrivee } from '../contexts/DriveeContext'
import { getTelegramUser } from '../utils/telegram'

export default function ProfileScreen() {
  const { state, actions } = useDrivee()
  const tg = getTelegramUser()
  const name = tg?.first_name ?? state.identity?.name ?? 'Foydalanuvchi'
  const completedRatings = state.pendingRatings.filter((rating) => rating.rating)
  const confirmedTrips = state.requests.filter((request) => request.status === 'confirmed')

  return (
    <div className="screen-enter pb-4 pt-2">
      <div className="px-1">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-muted">
          Profil
        </div>
        <h2 className="mt-2 text-2xl font-black text-brand-ink">{name}</h2>
      </div>

      <div className="mt-4 space-y-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue text-white">
              <UserRound className="h-6 w-6" />
            </div>
            <div>
              <div className="text-base font-black text-brand-ink">{name}</div>
              <div className="mt-1 text-sm font-semibold text-brand-muted">
                {state.role === 'driver' ? 'Haydovchi rejimi' : "Yo'lovchi rejimi"}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-brand-ink">
            <Repeat2 className="h-4 w-4 text-brand-blue" />
            Rolni almashtirish
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SecondaryButton
              type="button"
              onClick={() => actions.setRole('passenger')}
              className={state.role === 'passenger' ? 'border-brand-blue text-brand-blue' : undefined}
            >
              Yo'lovchi
            </SecondaryButton>
            <SecondaryButton
              type="button"
              onClick={() => actions.setRole('driver')}
              className={state.role === 'driver' ? 'border-brand-blue text-brand-blue' : undefined}
            >
              Haydovchi
            </SecondaryButton>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-brand-blue" />
            <div className="flex-1">
              <div className="text-sm font-black text-brand-ink">Joylashuv</div>
              <div className="mt-1 text-sm font-semibold text-brand-muted">
                {state.location?.labelUz ?? "Joylashuv tanlanmagan"}
              </div>
              <div className="mt-4">
                <PrimaryButton type="button" onClick={() => actions.clearLocation()}>
                  Joylashuvni qayta tanlash
                </PrimaryButton>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-black text-brand-ink">Tarix</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-brand-soft/40 px-3 py-3">
              <div className="text-2xl font-black text-brand-blue">{confirmedTrips.length}</div>
              <div className="text-xs font-bold text-brand-muted">Tanlangan safar</div>
            </div>
            <div className="rounded-lg bg-brand-soft/40 px-3 py-3">
              <div className="text-2xl font-black text-brand-blue">{completedRatings.length}</div>
              <div className="text-xs font-bold text-brand-muted">Baholangan</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-brand-ink">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            Mening baholarim
          </div>
          {completedRatings.length === 0 ? (
            <div className="rounded-lg border border-brand-line bg-brand-soft/40 px-4 py-3 text-sm font-semibold text-brand-muted">
              Hozircha baho yuborilmagan.
            </div>
          ) : (
            <div className="space-y-2">
              {completedRatings.map((rating) => (
                <div key={rating.id} className="rounded-lg border border-brand-line bg-white px-3 py-2 text-sm font-semibold text-brand-muted">
                  {rating.tripLabelUz} • {rating.rating?.stars} yulduz
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
