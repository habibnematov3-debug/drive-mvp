import { useMemo, useState } from 'react'
import { REGIONS, getRegion } from '../data/uzbekistan'
import { useDrivee } from '../contexts/DriveeContext'
import { Card, Chip, PrimaryButton } from '../components/ui'
import type { RegionId } from '../types/drivee'
import { cn } from '../lib/utils'
import { hapticSelection } from '../utils/telegram'

const WINDOWS = ['Hozir', '30 daqiqada', '1 soatda', '2 soatda'] as const

export default function DriverHomeScreen() {
  const { state, actions } = useDrivee()
  const [destinationRegionId, setDestinationRegionId] = useState<RegionId>('toshkent')
  const [windowLabel, setWindowLabel] = useState<(typeof WINDOWS)[number]>('30 daqiqada')
  const [seats, setSeats] = useState(3)
  const [price, setPrice] = useState(60000)

  const originLabel = state.location?.labelUz ?? "Joylashuv tanlanmagan"

  const incoming = useMemo(() => {
    const myDistrict = state.location?.districtId
    if (!myDistrict) return []
    return state.requests
      .filter((r) => r.status === 'active')
      .filter((r) => r.origin.districtId === myDistrict)
  }, [state.location?.districtId, state.requests])

  return (
    <div className="screen-enter pb-4 pt-2">
      <div className="px-1">
        <Chip className="border-brand-blue/20 bg-brand-blue/5 text-brand-blue">
          📍 Men hozir: <span className="font-black">{originLabel}</span>
        </Chip>
      </div>

      <div className="mt-4 space-y-3 px-1">
        <Card className="p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-muted">
            E&apos;lon qilish
          </div>

          <div className="mt-3">
            <div className="text-xs font-extrabold text-brand-ink">Manzil (viloyat)</div>
            <select
              value={destinationRegionId}
              onChange={(e) => setDestinationRegionId(e.target.value as RegionId)}
              className="mt-2 w-full rounded-[18px] border border-brand-line bg-white px-4 py-3 text-sm font-bold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
            >
              {REGIONS.filter((r) => r.id !== state.location?.regionId).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameUz}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <div className="text-xs font-extrabold text-brand-ink">Ketish vaqti</div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {WINDOWS.map((w) => {
                const active = windowLabel === w
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      hapticSelection()
                      setWindowLabel(w)
                    }}
                    className={cn(
                      'rounded-[16px] border px-2 py-3 text-[11px] font-black transition active:scale-[0.99]',
                      active
                        ? 'border-brand-blue bg-brand-blue text-white'
                        : 'border-brand-line bg-white text-brand-ink',
                    )}
                  >
                    {w}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-extrabold text-brand-ink">O‘rinlar</div>
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
            <div>
              <div className="text-xs font-extrabold text-brand-ink">Narx (1 o‘rin)</div>
              <input
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, '')) || 0)}
                className="mt-2 w-full rounded-[18px] border border-brand-line bg-white px-4 py-3 text-sm font-black text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
              />
              <div className="mt-1 text-xs font-semibold text-brand-muted">so‘m</div>
            </div>
          </div>

          <div className="mt-5">
            <PrimaryButton type="button" disabled>
              E&apos;lon qilish (MVP demo)
            </PrimaryButton>
            <div className="mt-2 text-center text-xs font-semibold text-brand-muted">
              Demo rejimda e&apos;lonlar serverga yuborilmaydi.
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-muted">
                Kelayotgan so&apos;rovlar
              </div>
              <div className="mt-2 text-base font-black text-brand-ink">
                {incoming.length} ta
              </div>
              <div className="mt-1 text-sm font-semibold text-brand-muted">
                Faqat sizning tumanga mos keladigan so&apos;rovlar ko&apos;rinadi.
              </div>
            </div>
            <div className="rounded-[16px] border border-brand-blue/20 bg-brand-blue/10 px-3 py-2 text-right">
              <div className="text-xs font-black text-brand-blue">{getRegion(destinationRegionId)?.nameUz ?? '—'}</div>
              <div className="mt-1 text-[10px] font-black text-brand-muted">{windowLabel}</div>
            </div>
          </div>

          {incoming.length === 0 ? (
            <div className="mt-4 rounded-[18px] border border-brand-line bg-brand-soft/30 px-4 py-3 text-sm font-semibold text-brand-muted">
              Hozircha mos so‘rovlar yo‘q. Yo‘lovchilar so‘rov yuborganda shu yerda chiqadi.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {incoming.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="rounded-[20px] border border-brand-line bg-white px-4 py-3"
                >
                  <div className="text-sm font-black text-brand-ink">
                    {getRegion(r.origin.regionId)?.nameUz ?? ''} → {getRegion(r.destinationRegionId)?.nameUz ?? ''}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-brand-muted">
                    {r.dateISO} • {r.timeApprox} • {r.seats} ta o‘rin
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        actions.applyToRequestAsDriver(r.id, {
                          driverId: 'drv_1',
                          pricePerSeat: price,
                          departureWindowLabelUz: windowLabel,
                          note: 'Yo‘lga chiqayapman, tezda yetaman.',
                        })
                      }}
                      className="flex-1 rounded-[16px] bg-emerald-600 px-3 py-3 text-xs font-black text-white transition active:scale-[0.99]"
                    >
                      Qabul qilish ✓
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-[16px] border border-brand-line bg-white px-3 py-3 text-xs font-black text-brand-ink transition active:scale-[0.99]"
                      disabled
                    >
                      Rad etish ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

