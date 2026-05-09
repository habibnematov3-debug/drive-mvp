import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Filter, Search, Star, X } from 'lucide-react'
import { Card } from '../components/ui'
import { REGIONS, getRegion } from '../data/uzbekistan'
import { useDrivee } from '../contexts/DriveeContext'
import type { DriverProfile, RegionId } from '../types/drivee'
import { cn } from '../lib/utils'
import { hapticImpact } from '../utils/telegram'
import { formatPreference } from './PassengerHomeScreen'

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-black">
        <span className="text-brand-muted">{label}</span>
        <span className="text-brand-ink">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-brand-soft">
        <div className="h-2 rounded-full bg-brand-blue" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function DriverProfileView({ driver, onBack }: { driver: DriverProfile; onBack: () => void }) {
  return (
    <div className="screen-enter pb-4 pt-2">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-brand-line bg-white px-3 py-2 text-xs font-black text-brand-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Ortga
      </button>

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue text-lg font-black text-white">
            {driver.initials}
          </div>
          <div className="flex-1">
            <div className="text-xl font-black text-brand-ink">{driver.name}</div>
            <div className="mt-1 text-sm font-semibold text-brand-muted">
              {driver.home.labelUz} • {driver.carModel}, {driver.carYear}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {driver.rating.avg} ({driver.rating.trips} ta safar)
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <RatingBar label="Vaqtida" value={driver.rating.onTimePct} />
          <RatingBar label="Mashina" value={driver.rating.carPct} />
          <RatingBar label="Muomala" value={driver.rating.mannersPct} />
        </div>
      </Card>

      <Card className="mt-3 p-5">
        <div className="text-sm font-black text-brand-ink">Oxirgi fikrlar</div>
        <div className="mt-3 space-y-2">
          {driver.reviews.map((review) => (
            <div key={review} className="rounded-lg border border-brand-line bg-brand-soft/30 px-3 py-2 text-sm font-semibold text-brand-muted">
              {review}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function RequestsScreen() {
  const { state, actions } = useDrivee()
  const [mode, setMode] = useState<'requests' | 'drivers'>('requests')
  const [query, setQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState<RegionId | 'all'>('all')
  const [ratingFilter, setRatingFilter] = useState<'all' | '4.7'>('all')
  const [activeOnly, setActiveOnly] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)

  const myDistrict = state.location?.districtId
  const driverIncoming = useMemo(
    () => state.requests.filter((request) => request.status === 'active' && request.origin.districtId === myDistrict),
    [myDistrict, state.requests],
  )
  const passengerRequests = state.requests
  const selectedDriver = selectedDriverId ? state.drivers.find((driver) => driver.id === selectedDriverId) : null

  const filteredDrivers = useMemo(() => {
    const search = query.trim().toLowerCase()

    return state.drivers.filter((driver) => {
      if (regionFilter !== 'all' && driver.home.regionId !== regionFilter) return false
      if (ratingFilter === '4.7' && driver.rating.avg < 4.7) return false
      if (activeOnly && !driver.activeNow) return false
      if (!search) return true

      return [
        driver.name,
        driver.home.labelUz,
        driver.carModel,
        String(driver.carYear),
      ].some((value) => value.toLowerCase().includes(search))
    })
  }, [activeOnly, query, ratingFilter, regionFilter, state.drivers])

  if (selectedDriver) {
    return <DriverProfileView driver={selectedDriver} onBack={() => setSelectedDriverId(null)} />
  }

  if (state.role === 'driver') {
    return (
      <div className="screen-enter pb-4 pt-2">
        <div className="px-1">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-muted">
            Arizalar
          </div>
          <h2 className="mt-2 text-2xl font-black text-brand-ink">Kelayotgan so'rovlar</h2>
        </div>

        <div className="mt-4 space-y-3">
          {driverIncoming.length === 0 ? (
            <Card className="p-5">
              <div className="text-lg font-black text-brand-ink">Hozircha mos so'rov yo'q</div>
              <div className="mt-2 text-sm font-semibold text-brand-muted">
                Tumaningizga mos yo'lovchi so'rovlari shu yerda chiqadi.
              </div>
            </Card>
          ) : (
            driverIncoming.map((request) => (
              <Card key={request.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-brand-ink">{request.passengerName}</div>
                    <div className="mt-1 text-sm font-semibold text-brand-muted">
                      {request.origin.labelUz} {'->'} {getRegion(request.destinationRegionId)?.nameUz}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-brand-muted">
                      {request.timeApprox} • {request.seats} ta o'rin
                    </div>
                  </div>
                  <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-black text-brand-blue">
                    Mos
                  </span>
                </div>

                {request.preferences.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {request.preferences.map((preference) => (
                      <span key={preference} className="rounded-full bg-brand-soft px-2 py-1 text-[11px] font-black text-brand-ink">
                        {formatPreference(preference)}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      actions.applyToRequestAsDriver(request.id, {
                        driverId: 'drv_1',
                        pricePerSeat: 60000,
                        departureWindowLabelUz: '30 daqiqada',
                        note: "Yo'lga chiqishga tayyorman.",
                      })
                      hapticImpact('light')
                    }}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-3 text-xs font-black text-white"
                  >
                    <Check className="h-4 w-4" />
                    Qabul qilish
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-brand-line bg-white px-3 py-3 text-xs font-black text-brand-ink"
                  >
                    <X className="h-4 w-4" />
                    Rad etish
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="screen-enter pb-4 pt-2">
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-brand-line bg-white p-1">
        {[
          { key: 'requests' as const, label: 'Arizalar' },
          { key: 'drivers' as const, label: 'Haydovchilar' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMode(item.key)}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-black',
              mode === item.key ? 'bg-brand-blue text-white' : 'text-brand-muted',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === 'requests' ? (
        <div className="mt-4 space-y-3">
          {passengerRequests.length === 0 ? (
            <Card className="p-5">
              <div className="text-lg font-black text-brand-ink">Hozircha so'rov yuborilmagan</div>
              <div className="mt-2 text-sm font-semibold text-brand-muted">
                Bosh sahifadan so'rov yuboring. Haydovchi arizalari shu yerda ko'rinadi.
              </div>
            </Card>
          ) : (
            passengerRequests.map((request) => (
              <Card key={request.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-brand-ink">
                      {request.origin.labelUz} {'->'} {getRegion(request.destinationRegionId)?.nameUz}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-brand-muted">
                      {request.dateISO} • {request.timeApprox} • {request.seats} ta o'rin
                    </div>
                  </div>
                  <div className="rounded-lg border border-brand-blue/20 bg-brand-blue/10 px-3 py-2 text-right">
                    <div className="text-xs font-black text-brand-blue">{request.applicants.length} ta</div>
                    <div className="text-[10px] font-black text-brand-muted">haydovchi</div>
                  </div>
                </div>
                {request.status === 'confirmed' ? (
                  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                    Haydovchi tanlangan. Telefon raqam ochilgan.
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-brand-line bg-brand-soft/40 px-4 py-3 text-sm font-semibold text-brand-muted">
                    Arizalar reyting va ketish vaqtiga qarab saralanadi.
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-brand-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Haydovchi, tuman yoki mashina"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-brand-ink outline-none placeholder:text-brand-muted"
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <select
                value={regionFilter}
                onChange={(event) => setRegionFilter(event.target.value as RegionId | 'all')}
                className="rounded-lg border border-brand-line bg-white px-2 py-2 text-xs font-bold text-brand-ink"
              >
                <option value="all">Barchasi</option>
                {REGIONS.filter((region) => region.mode === 'tuman_match').map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.nameUz}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setRatingFilter((current) => (current === 'all' ? '4.7' : 'all'))}
                className={cn(
                  'inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-black',
                  ratingFilter === '4.7'
                    ? 'border-brand-blue bg-brand-blue text-white'
                    : 'border-brand-line bg-white text-brand-ink',
                )}
              >
                <Star className="h-3.5 w-3.5" />
                4.7+
              </button>
              <button
                type="button"
                onClick={() => setActiveOnly((current) => !current)}
                className={cn(
                  'inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-black',
                  activeOnly
                    ? 'border-brand-blue bg-brand-blue text-white'
                    : 'border-brand-line bg-white text-brand-ink',
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                Faol
              </button>
            </div>
          </Card>

          {filteredDrivers.length === 0 ? (
            <Card className="p-5">
              <div className="text-lg font-black text-brand-ink">Haydovchi topilmadi</div>
              <div className="mt-2 text-sm font-semibold text-brand-muted">
                Filtrlarni o'zgartirib qayta urinib ko'ring.
              </div>
            </Card>
          ) : (
            filteredDrivers.map((driver) => (
              <Card key={driver.id} className="p-5">
                <button type="button" onClick={() => setSelectedDriverId(driver.id)} className="block w-full text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue text-sm font-black text-white">
                      {driver.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-brand-ink">{driver.name}</div>
                      <div className="truncate text-sm font-semibold text-brand-muted">
                        {driver.home.labelUz} • {driver.carModel}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-black text-brand-ink">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {driver.rating.avg}
                      </div>
                      <div className="text-[11px] font-bold text-brand-muted">{driver.rating.trips} safar</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {driver.activeNow ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
                        Hozir faol
                      </span>
                    ) : null}
                    {driver.badges.map((badge) => (
                      <span key={badge} className="rounded-full bg-brand-soft px-2 py-1 text-[11px] font-black text-brand-ink">
                        {badge === 'verified' ? 'Tasdiqlangan' : badge === 'clean' ? 'Toza' : "O'z vaqtida"}
                      </span>
                    ))}
                  </div>
                </button>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
