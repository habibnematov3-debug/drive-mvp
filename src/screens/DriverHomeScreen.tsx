import { useMemo, useState } from 'react'
import { Check, MapPin, Send, X } from 'lucide-react'
import { Card, Chip, PrimaryButton, SecondaryButton } from '../components/ui'
import { REGIONS, getRegion } from '../data/uzbekistan'
import { useDrivee } from '../contexts/DriveeContext'
import type { DriverApplication, RegionId } from '../types/drivee'
import { cn } from '../lib/utils'
import { hapticImpact, hapticSelection } from '../utils/telegram'

const WINDOWS: DriverApplication['departureWindowLabelUz'][] = ['Hozir', '30 daqiqada', '1 soatda', '2 soatda']

export default function DriverHomeScreen() {
  const { state, actions } = useDrivee()
  const [destinationRegionId, setDestinationRegionId] = useState<RegionId>('toshkent')
  const [departureWindowLabelUz, setDepartureWindowLabelUz] = useState<DriverApplication['departureWindowLabelUz']>('30 daqiqada')
  const [seatsAvailable, setSeatsAvailable] = useState(3)
  const [pricePerSeat, setPricePerSeat] = useState(60000)
  const [frontSeatExtra, setFrontSeatExtra] = useState(10000)
  const [smoking, setSmoking] = useState<'no' | 'yes'>('no')
  const [note, setNote] = useState("Yo'lga tayyorman.")
  const [posted, setPosted] = useState(false)

  const originLabel = state.location?.labelUz ?? "Joylashuv tanlanmagan"
  const myDistrict = state.location?.districtId
  const incoming = useMemo(
    () => state.requests.filter((request) => request.status === 'active' && request.origin.districtId === myDistrict),
    [myDistrict, state.requests],
  )
  const liveRide = state.driverRides[0] ?? null

  function publishRide() {
    actions.createDriverRide({
      destinationRegionId,
      departureWindowLabelUz,
      seatsAvailable,
      pricePerSeat,
      frontSeatExtra,
      smoking,
      note: note.trim() || undefined,
    })
    hapticImpact('medium')
    setPosted(true)
  }

  function acceptRequest(requestId: string) {
    actions.applyToRequestAsDriver(requestId, {
      driverId: 'drv_1',
      pricePerSeat,
      departureWindowLabelUz,
      note: note.trim() || "Yo'lga chiqaman, tezda yetaman.",
    })
    hapticImpact('light')
  }

  return (
    <div className="screen-enter pb-4 pt-2">
      <div className="px-1">
        <Chip className="border-brand-blue/20 bg-brand-blue/5 text-brand-blue">
          <MapPin className="h-4 w-4" />
          Men hozir: <span className="font-black">{originLabel}</span>
        </Chip>
      </div>

      <div className="mt-4 space-y-3">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-muted">
                E'lon qilish
              </div>
              <h2 className="mt-2 text-xl font-black text-brand-ink">Toshkentga chiqish</h2>
            </div>
            {posted || liveRide ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                Faol
              </span>
            ) : null}
          </div>

          <label className="mt-4 block text-xs font-extrabold text-brand-ink" htmlFor="driver-destination">
            Manzil viloyati
          </label>
          <select
            id="driver-destination"
            value={destinationRegionId}
            onChange={(event) => setDestinationRegionId(event.target.value as RegionId)}
            className="mt-2 w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm font-bold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
          >
            {REGIONS.filter((region) => region.id !== state.location?.regionId).map((region) => (
              <option key={region.id} value={region.id}>
                {region.nameUz}
              </option>
            ))}
          </select>

          <div className="mt-4">
            <div className="text-xs font-extrabold text-brand-ink">Ketish vaqti</div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {WINDOWS.map((windowLabel) => (
                <button
                  key={windowLabel}
                  type="button"
                  onClick={() => {
                    hapticSelection()
                    setDepartureWindowLabelUz(windowLabel)
                  }}
                  className={cn(
                    'rounded-lg border px-2 py-3 text-[11px] font-black transition active:scale-[0.99]',
                    departureWindowLabelUz === windowLabel
                      ? 'border-brand-blue bg-brand-blue text-white'
                      : 'border-brand-line bg-white text-brand-ink',
                  )}
                >
                  {windowLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-extrabold text-brand-ink">Bo'sh joy</div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      hapticSelection()
                      setSeatsAvailable(count)
                    }}
                    className={cn(
                      'rounded-lg border px-0 py-3 text-sm font-black transition active:scale-[0.99]',
                      seatsAvailable === count
                        ? 'border-brand-blue bg-brand-blue text-white'
                        : 'border-brand-line bg-white text-brand-ink',
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="text-xs font-extrabold text-brand-ink">Narx, 1 o'rin</span>
              <input
                inputMode="numeric"
                value={pricePerSeat}
                onChange={(event) => setPricePerSeat(Number(event.target.value.replace(/\D/g, '')) || 0)}
                className="mt-2 w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm font-black text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-extrabold text-brand-ink">Old o'rindiq ustama</span>
              <input
                inputMode="numeric"
                value={frontSeatExtra}
                onChange={(event) => setFrontSeatExtra(Number(event.target.value.replace(/\D/g, '')) || 0)}
                className="mt-2 w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm font-black text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
              />
            </label>
            <div>
              <div className="text-xs font-extrabold text-brand-ink">Chekish</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  { value: 'no' as const, label: "Yo'q" },
                  { value: 'yes' as const, label: 'Bor' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSmoking(option.value)}
                    className={cn(
                      'rounded-lg border px-3 py-3 text-xs font-black',
                      smoking === option.value
                        ? 'border-brand-blue bg-brand-blue text-white'
                        : 'border-brand-line bg-white text-brand-ink',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="text-xs font-extrabold text-brand-ink">Qisqa izoh</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              className="mt-2 w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm font-semibold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
            />
          </label>

          <div className="mt-5">
            <PrimaryButton type="button" onClick={publishRide}>
              E'lon qilish
            </PrimaryButton>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-muted">
                Kelayotgan so'rovlar
              </div>
              <div className="mt-2 text-base font-black text-brand-ink">{incoming.length} ta</div>
              <div className="mt-1 text-sm font-semibold text-brand-muted">
                Bu ro'yxatda faqat siz turgan tumandagi yo'lovchilar bor.
              </div>
            </div>
            <div className="rounded-lg border border-brand-blue/20 bg-brand-blue/10 px-3 py-2 text-right">
              <div className="text-xs font-black text-brand-blue">{getRegion(destinationRegionId)?.nameUz}</div>
              <div className="mt-1 text-[10px] font-black text-brand-muted">{departureWindowLabelUz}</div>
            </div>
          </div>

          {incoming.length === 0 ? (
            <div className="mt-4 rounded-lg border border-brand-line bg-brand-soft/40 px-4 py-3 text-sm font-semibold text-brand-muted">
              Hozircha mos so'rov yo'q. Yo'lovchi shu tumandan so'rov yuborsa, darhol ko'rinadi.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {incoming.slice(0, 3).map((request) => (
                <div key={request.id} className="rounded-lg border border-brand-line bg-white px-4 py-3">
                  <div className="text-sm font-black text-brand-ink">
                    {request.passengerName} • {request.origin.labelUz}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-brand-muted">
                    {getRegion(request.destinationRegionId)?.nameUz} • {request.timeApprox} • {request.seats} ta o'rin
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => acceptRequest(request.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-3 text-xs font-black text-white transition active:scale-[0.99]"
                    >
                      <Check className="h-4 w-4" />
                      Qabul
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-brand-line bg-white px-3 py-3 text-xs font-black text-brand-ink"
                    >
                      <X className="h-4 w-4" />
                      Rad etish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {liveRide ? (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Send className="h-5 w-5 text-brand-blue" />
              <div>
                <div className="text-sm font-black text-brand-ink">
                  E'lon faol: {getRegion(liveRide.destinationRegionId)?.nameUz}
                </div>
                <div className="text-xs font-semibold text-brand-muted">
                  {liveRide.departureWindowLabelUz} • {liveRide.seatsAvailable} joy • {liveRide.pricePerSeat.toLocaleString('uz-UZ')} so'm
                </div>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
