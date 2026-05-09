import { Card, PrimaryButton, SecondaryButton } from '../components/ui'
import { useDrivee } from '../contexts/DriveeContext'
import { getTelegramUser } from '../utils/telegram'

export default function ProfileScreen() {
  const { state, actions } = useDrivee()
  const tg = getTelegramUser()

  return (
    <div className="screen-enter pb-4 pt-2">
      <div className="px-1">
        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-muted">
          Profil
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-brand-ink">
          {tg?.first_name ?? state.identity?.name ?? 'Foydalanuvchi'}
        </h2>
      </div>

      <div className="mt-4 space-y-3 px-1">
        <Card className="p-5">
          <div className="text-sm font-black text-brand-ink">Rol</div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <SecondaryButton
              type="button"
              onClick={() => actions.setRole('passenger')}
              className={state.role === 'passenger' ? 'border-brand-blue text-brand-blue' : undefined}
            >
              Yo&apos;lovchi
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
          <div className="text-sm font-black text-brand-ink">Joylashuv</div>
          <div className="mt-2 text-sm font-semibold text-brand-muted">
            {state.location?.labelUz ?? "Joylashuv tanlanmagan"}
          </div>
          <div className="mt-4">
            <PrimaryButton type="button" onClick={() => actions.clearLocation()}>
              Joylashuvni qayta tanlash
            </PrimaryButton>
          </div>
        </Card>
      </div>
    </div>
  )
}
