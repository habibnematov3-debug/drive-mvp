import { useMemo, useState } from 'react'
import { REGIONS, getRegion } from '../data/uzbekistan'
import { useDrivee } from '../contexts/DriveeContext'
import { Card, Chip, PrimaryButton, SecondaryButton } from '../components/ui'
import type { PassengerPreference, RegionId } from '../types/drivee'
import { cn } from '../lib/utils'
import { hapticSelection } from '../utils/telegram'

const PREFS: Array<{ key: PassengerPreference; label: string; emoji: string }> = [
  { key: 'front_seat', label: "Old o'rindiq", emoji: '💺' },
  { key: 'non_smoking', label: 'Chekmaslik', emoji: '🚭' },
  { key: 'clean_car', label: 'Toza mashina', emoji: '⭐' },
  { key: 'women_only', label: 'Ayollar uchun', emoji: '👩' },
  { key: 'ac', label: 'Konditsioner', emoji: '❄️' },
]

export default function PassengerHomeScreen({
  onCreate,
}: {
  onCreate: (payload: {
    destinationRegionId: RegionId
    dateISO: string
    timeApprox: string
    seats: number
    preferences: PassengerPreference[]
  }) => void
}) {
  const { state } = useDrivee()
  const [destinationRegionId, setDestinationRegionId] = useState<RegionId>('toshkent')
  const [preferences, setPreferences] = useState<PassengerPreference[]>([])
  const [dateISO, setDateISO] = useState(() => new Date().toISOString().slice(0, 10))
  const [timeApprox, setTimeApprox] = useState('10:00')
  const [seats, setSeats] = useState(1)

  const originLabel = state.location?.labelUz ?? "Joylashuv tanlanmagan"
  const destinationLabel = getRegion(destinationRegionId)?.nameUz ?? '—'

  const myRequests = useMemo(() => state.requests.filter((r) => r.status !== 'cancelled'), [state.requests])
  const latest = myRequests[0] ?? null

  return (
    <div className="screen-enter pb-4 pt-2">
      <div className="px-1">
        <Chip className="border-brand-blue/20 bg-brand-blue/5 text-brand-blue">
          📍 {originLabel}
        </Chip>
      </div>

      <div className="mt-4 space-y-3 px-1">
        <Card className="p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-muted">
            So&apos;rov yuborish
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-extrabold text-brand-ink">Manzil (viloyat)</div>
              <select
                value={destinationRegionId}
                onChange={(e) => setDestinationRegionId(e.target.value as RegionId)}
                className="mt-2 w-full rounded-[18px] border border-brand-line bg-white px-3 py-3 text-sm font-bold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
              >
                {REGIONS.filter((r) => r.id !== state.location?.regionId).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nameUz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs font-extrabold text-brand-ink">O&apos;rindiqlar</div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((n) => {
                  const active = seats === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        hapticSelection()
                        setSeats(n)
                      }}
                      className={cn(
                        'rounded-[16px] border px-0 py-3 text-sm font-black transition active:scale-[0.99]',
                        active
                          ? 'border-brand-blue bg-brand-blue text-white'
                          : 'border-brand-line bg-white text-brand-ink',
                      )}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-extrabold text-brand-ink">Sana</div>
              <input
                type="date"
                value={dateISO}
                onChange={(e) => setDateISO(e.target.value)}
                className="mt-2 w-full rounded-[18px] border border-brand-line bg-white px-3 py-3 text-sm font-bold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
              />
            </div>
            <div>
              <div className="text-xs font-extrabold text-brand-ink">Taxminiy vaqt</div>
              <input
                type="time"
                value={timeApprox}
                onChange={(e) => setTimeApprox(e.target.value)}
                className="mt-2 w-full rounded-[18px] border border-brand-line bg-white px-3 py-3 text-sm font-bold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-extrabold text-brand-ink">Afzalliklar</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {PREFS.map((p) => {
                const active = preferences.includes(p.key)
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      hapticSelection()
                      setPreferences((prev) =>
                        prev.includes(p.key) ? prev.filter((x) => x !== p.key) : [...prev, p.key],
                      )
                    }}
                    className={cn(
                      'rounded-full border px-3 py-2 text-xs font-black transition active:scale-[0.99]',
                      active
                        ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                        : 'border-brand-line bg-white text-brand-ink',
                    )}
                  >
                    {p.emoji} {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5">
            <PrimaryButton
              type="button"
              onClick={() => {
                onCreate({ destinationRegionId, dateISO, timeApprox, seats, preferences })
              }}
            >
              So&apos;rov yuborish
            </PrimaryButton>
            <div className="mt-2 text-center text-xs font-semibold text-brand-muted">
              Ko&apos;rinadigan haydovchilar: faqat <span className="font-black">{originLabel}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-muted">
                Faol ariza
              </div>
              <div className="mt-2 text-base font-black text-brand-ink">
                {latest
                  ? `${getRegion(latest.origin.regionId)?.nameUz ?? ''} → ${destinationLabel}`
                  : 'Hozircha ariza yo‘q'}
              </div>
              {latest ? (
                <div className="mt-1 text-sm font-semibold text-brand-muted">
                  {latest.dateISO} • {latest.timeApprox} • {latest.seats} ta o‘rin
                </div>
              ) : (
                <div className="mt-1 text-sm font-semibold text-brand-muted">
                  Yuqoridagi formadan so‘rov yuboring.
                </div>
              )}
            </div>
            {latest ? (
              <div className="rounded-[16px] border border-brand-blue/20 bg-brand-blue/10 px-3 py-2 text-right">
                <div className="text-xs font-black text-brand-blue">
                  {latest.applicants.length} ta haydovchi
                </div>
                {latest.applicants.length > 0 ? (
                  <div className="mt-1 inline-flex items-center rounded-full bg-brand-blue px-2 py-1 text-[10px] font-black text-white">
                    NEW
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {latest ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SecondaryButton type="button" disabled>
                Kutilyapti…
              </SecondaryButton>
              <PrimaryButton type="button" disabled={latest.applicants.length === 0}>
                Arizalar → 
              </PrimaryButton>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  )
}

