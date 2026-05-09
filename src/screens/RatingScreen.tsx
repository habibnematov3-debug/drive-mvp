import { useMemo, useState } from 'react'
import { Car, Clock3, MessageCircle, Smile, Star, X } from 'lucide-react'
import { Card, PrimaryButton, SecondaryButton } from '../components/ui'
import { useDrivee } from '../contexts/DriveeContext'
import { cn } from '../lib/utils'
import { hapticImpact, hapticSelection } from '../utils/telegram'

function StarSelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => {
            hapticSelection()
            onChange(star)
          }}
          className={cn(
            'flex h-12 items-center justify-center rounded-lg border transition active:scale-[0.98]',
            star <= value ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-brand-line bg-white text-brand-muted',
          )}
          aria-label={`${star} yulduz`}
        >
          <Star className={cn('h-6 w-6', star <= value ? 'fill-amber-400' : '')} />
        </button>
      ))}
    </div>
  )
}

export default function RatingScreen() {
  const { state, actions } = useDrivee()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [stars, setStars] = useState(5)
  const [onTime, setOnTime] = useState(5)
  const [car, setCar] = useState(5)
  const [manners, setManners] = useState(5)
  const [comment, setComment] = useState('')

  const pending = useMemo(() => state.pendingRatings.filter((rating) => !rating.rating), [state.pendingRatings])
  const completed = useMemo(() => state.pendingRatings.filter((rating) => rating.rating), [state.pendingRatings])
  const active = activeId ? state.pendingRatings.find((rating) => rating.id === activeId) : null

  function openModal(id: string) {
    setActiveId(id)
    setStars(5)
    setOnTime(5)
    setCar(5)
    setManners(5)
    setComment('')
  }

  return (
    <div className="screen-enter pb-4 pt-2">
      <div className="px-1">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-muted">
          Baholash
        </div>
        <h2 className="mt-2 text-2xl font-black text-brand-ink">Tugallangan safarlar</h2>
      </div>

      <div className="mt-4 space-y-3">
        {pending.length === 0 ? (
          <Card className="p-5">
            <div className="text-lg font-black text-brand-ink">Hozircha baholanadigan safar yo'q</div>
            <div className="mt-2 text-sm font-semibold text-brand-muted">
              Safar tugagach, bot va mini app orqali baholash chiqadi.
            </div>
          </Card>
        ) : (
          pending.map((rating) => {
            const driver = state.drivers.find((item) => item.id === rating.driverId)

            return (
              <Card key={rating.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-brand-ink">{rating.tripLabelUz}</div>
                    <div className="mt-1 text-sm font-semibold text-brand-muted">
                      {driver?.name ?? 'Haydovchi'} • {new Date(rating.completedAtISO).toLocaleDateString('uz-UZ')}
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                    Kutilmoqda
                  </span>
                </div>
                <div className="mt-4">
                  <PrimaryButton type="button" onClick={() => openModal(rating.id)}>
                    Baholash
                  </PrimaryButton>
                </div>
              </Card>
            )
          })
        )}

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 h-5 w-5 text-brand-blue" />
            <div>
              <div className="text-sm font-black text-brand-ink">Bot bilan sinxron</div>
              <div className="mt-1 text-sm font-semibold text-brand-muted">
                Appda baholasangiz, bot "Bahoyingiz qabul qilindi" deb tasdiqlaydi.
              </div>
            </div>
          </div>
        </Card>

        {completed.length ? (
          <Card className="p-5">
            <div className="text-sm font-black text-brand-ink">Yuborilgan baholar</div>
            <div className="mt-3 space-y-2">
              {completed.map((rating) => (
                <div key={rating.id} className="rounded-lg border border-brand-line bg-brand-soft/30 px-3 py-2 text-sm font-semibold text-brand-muted">
                  {rating.tripLabelUz} • {rating.rating?.stars} yulduz
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-end bg-brand-ink/45 px-4 pb-6 pt-12">
          <div className="mx-auto w-full max-w-[390px] rounded-lg border border-brand-line bg-white p-5 shadow-soft" role="dialog" aria-modal="true">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black text-brand-ink">Safarni baholang</div>
                <div className="mt-1 text-sm font-semibold text-brand-muted">{active.tripLabelUz}</div>
              </div>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-line text-brand-muted"
                aria-label="Yopish"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <div className="text-sm font-black text-brand-ink">Umumiy baho</div>
              <div className="mt-2">
                <StarSelector value={stars} onChange={setStars} />
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-black text-brand-ink">
                  <Clock3 className="h-4 w-4 text-brand-blue" />
                  Vaqtida
                </div>
                <StarSelector value={onTime} onChange={setOnTime} />
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-black text-brand-ink">
                  <Car className="h-4 w-4 text-brand-blue" />
                  Mashina holati
                </div>
                <StarSelector value={car} onChange={setCar} />
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-black text-brand-ink">
                  <Smile className="h-4 w-4 text-brand-blue" />
                  Muomala
                </div>
                <StarSelector value={manners} onChange={setManners} />
              </div>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-black text-brand-ink">Izoh</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Qisqa fikr..."
                rows={3}
                className="mt-2 w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm font-semibold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
              />
            </label>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <SecondaryButton type="button" onClick={() => setActiveId(null)}>
                Yopish
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => {
                  actions.submitRating(active.id, {
                    stars: stars as 1 | 2 | 3 | 4 | 5,
                    onTime: onTime as 1 | 2 | 3 | 4 | 5,
                    car: car as 1 | 2 | 3 | 4 | 5,
                    manners: manners as 1 | 2 | 3 | 4 | 5,
                    comment: comment.trim() || undefined,
                  })
                  hapticImpact('medium')
                  setActiveId(null)
                }}
              >
                Baholash
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
