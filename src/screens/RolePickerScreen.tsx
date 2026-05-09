import { Car, Compass } from 'lucide-react'
import { Card, PrimaryButton, SecondaryButton } from '../components/ui'
import { useDrivee } from '../contexts/DriveeContext'
import { hapticImpact, hapticSelection } from '../utils/telegram'

export default function RolePickerScreen() {
  const { actions } = useDrivee()

  return (
    <div className="screen-enter flex min-h-screen flex-col justify-center bg-brand-bg px-4 py-6">
      <div className="text-center">
        <div className="text-[12px] font-black uppercase tracking-[0.18em] text-brand-muted">
          Drivee
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-normal text-brand-ink">
          Qanday foydalanasiz?
        </h1>
        <p className="mx-auto mt-2 max-w-[280px] text-sm font-semibold leading-relaxed text-brand-muted">
          Rolingizni tanlang. Keyin Profil sahifasidan istalgan vaqtda almashtirasiz.
        </p>
      </div>

      <div className="mt-7 space-y-3">
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <Car className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-black text-brand-ink">Haydovchi</div>
              <div className="mt-1 text-sm font-semibold text-brand-muted">Men haydovchiman</div>
            </div>
          </div>
          <div className="mt-5">
            <PrimaryButton
              type="button"
              onClick={() => {
                hapticSelection()
                hapticImpact('light')
                actions.setRole('driver')
              }}
            >
              Haydovchi bo'lib kirish
            </PrimaryButton>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <Compass className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-black text-brand-ink">Yo'lovchi</div>
              <div className="mt-1 text-sm font-semibold text-brand-muted">Menga safar kerak</div>
            </div>
          </div>
          <div className="mt-5">
            <SecondaryButton
              type="button"
              onClick={() => {
                hapticSelection()
                hapticImpact('light')
                actions.setRole('passenger')
              }}
            >
              Yo'lovchi bo'lib kirish
            </SecondaryButton>
          </div>
        </Card>
      </div>
    </div>
  )
}
