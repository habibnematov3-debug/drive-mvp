import { useMemo, useState } from 'react'
import { Card, PrimaryButton, SecondaryButton } from '../components/ui'
import { useDrivee } from '../contexts/DriveeContext'
import { cn } from '../lib/utils'
import { hapticSelection } from '../utils/telegram'

function StarRow({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => {
            hapticSelection()
            onChange(n)
          }}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-[16px] border text-lg font-black transition active:scale-[0.98]',
            n <= value ? 'border-brand-blue bg-brand-blue/10' : 'border-brand-line bg-white',
          )}
          aria-label={`${n} yulduz`}
        >
          {n <= value ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  )
}

export default function RatingScreen() {
  const { state, actions } = useDrivee()
  const [activeId, setActiveId] = useState<string | null>(null)

  const pending = useMemo(
    () => state.pendingRatings.filter((p) => !p.rating),
    [state.pendingRatings],
  )
  const active = activeId ? state.pendingRatings.find((p) => p.id === activeId) : null

  const [stars, setStars] = useState(5)
  const [onTime, setOnTime] = useState(5)
  const [car, setCar] = useState(5)
  const [manners, setManners] = useState(5)
  const [comment, setComment] = useState('')

  return (
    <div className="screen-enter pb-4 pt-2">
      <div className="px-1">
        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-muted">
          Baholash
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-brand-ink">
          Tugallangan safarlar
        </h2>
      </div>

      <div className="mt-4 space-y-3 px-1">
        {pending.length === 0 ? (
          <Card className="p-5">
            <div className="text-lg font-black text-brand-ink">Hozircha baholanadigan safar yo‘q</div>
            <div className="mt-2 text-sm font-semibold text-brand-muted">
              Safar tugagach, shu yerda baholash chiqadi.
            </div>
          </Card>
        ) : (
          pending.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="text-base font-black text-brand-ink">{p.tripLabelUz}</div>
              <div className="mt-1 text-sm font-semibold text-brand-muted">
                Sana: {new Date(p.completedAtISO).toLocaleDateString('uz-UZ')}
              </div>
              <div className="mt-4">
                <PrimaryButton
                  type="button"
                  onClick={() => {
                    setActiveId(p.id)
                    setStars(5)
                    setOnTime(5)
                    setCar(5)
                    setManners(5)
                    setComment('')
                  }}
                >
                  Baholash
                </PrimaryButton>
              </div>
            </Card>
          ))
        )}
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-end bg-brand-ink/45 px-4 pb-6 pt-12">
          <div
            className="mx-auto w-full max-w-md rounded-[32px] border border-brand-line bg-white p-5 shadow-soft"
            role="dialog"
            aria-modal="true"
          >
            <div className="text-lg font-black text-brand-ink">Baholash</div>
            <div className="mt-1 text-sm font-semibold text-brand-muted">{active.tripLabelUz}</div>

            <div className="mt-4">
              <div className="text-sm font-black text-brand-ink">Umumiy</div>
              <div className="mt-2">
                <StarRow value={stars} onChange={setStars} />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-sm font-black text-brand-ink">⏱ Vaqtida</div>
                <div className="mt-2">
                  <StarRow value={onTime} onChange={setOnTime} />
                </div>
              </div>
              <div>
                <div className="text-sm font-black text-brand-ink">🚗 Mashina holati</div>
                <div className="mt-2">
                  <StarRow value={car} onChange={setCar} />
                </div>
              </div>
              <div>
                <div className="text-sm font-black text-brand-ink">😊 Muomala</div>
                <div className="mt-2">
                  <StarRow value={manners} onChange={setManners} />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-black text-brand-ink">Izoh (ixtiyoriy)</div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Qisqa fikr..."
                className="mt-2 w-full rounded-[18px] border border-brand-line bg-white px-4 py-3 text-sm font-semibold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
                rows={3}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <SecondaryButton
                type="button"
                onClick={() => setActiveId(null)}
              >
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
                    comment: comment.trim() ? comment.trim() : undefined,
                  })
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

