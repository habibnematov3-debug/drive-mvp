import { Card, PrimaryButton, SecondaryButton } from '../components/ui'
import { useDrivee } from '../contexts/DriveeContext'
import { hapticImpact, hapticSelection } from '../utils/telegram'

export default function RolePickerScreen() {
  const { actions } = useDrivee()

  return (
    <div className="screen-enter flex min-h-[75vh] flex-col justify-center pb-6 pt-6">
      <div className="px-1 text-center">
        <div className="text-[12px] font-black uppercase tracking-[0.28em] text-brand-muted">
          Drivee
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-brand-ink">
          Siz kimsiz?
        </h1>
        <p className="mx-auto mt-2 max-w-[260px] text-sm font-semibold leading-relaxed text-brand-muted">
          Birinchi marta kiryapsiz. Rolingizni tanlang — keyin Profil bo&apos;limidan
          o&apos;zgartirishingiz mumkin.
        </p>
      </div>

      <div className="mt-6 space-y-3 px-1">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-brand-blue/10 text-xl">
              🚗
            </div>
            <div className="flex-1">
              <div className="text-lg font-black text-brand-ink">Haydovchi</div>
              <div className="mt-1 text-sm font-semibold text-brand-muted">
                Men haydovchiman
              </div>
            </div>
          </div>
          <div className="mt-4">
            <PrimaryButton
              type="button"
              onClick={() => {
                hapticSelection()
                hapticImpact('light')
                actions.setRole('driver')
              }}
            >
              Tanlash
            </PrimaryButton>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-brand-blue/10 text-xl">
              🧭
            </div>
            <div className="flex-1">
              <div className="text-lg font-black text-brand-ink">Yo&apos;lovchi</div>
              <div className="mt-1 text-sm font-semibold text-brand-muted">
                Menga safar kerak
              </div>
            </div>
          </div>
          <div className="mt-4">
            <SecondaryButton
              type="button"
              onClick={() => {
                hapticSelection()
                actions.setRole('passenger')
              }}
            >
              Tanlash
            </SecondaryButton>
          </div>
        </Card>
      </div>
    </div>
  )
}

