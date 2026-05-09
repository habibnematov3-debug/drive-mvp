import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock3, MapPin, Phone, Plus, Star } from 'lucide-react'
import { Card, Chip, PrimaryButton, SecondaryButton } from '../components/ui'
import { REGIONS, getRegion } from '../data/uzbekistan'
import { useDrivee } from '../contexts/DriveeContext'
import type { DriverApplication, PassengerPreference, PassengerRequest, RegionId } from '../types/drivee'
import { cn } from '../lib/utils'
import { hapticImpact, hapticSelection } from '../utils/telegram'

const PREFS: Array<{ key: PassengerPreference; label: string; icon: string }> = [
  { key: 'front_seat', label: "Old o'rindiq", icon: '💺' },
  { key: 'non_smoking', label: 'Chekmaslik', icon: '🚭' },
  { key: 'clean_car', label: 'Toza mashina', icon: '⭐' },
  { key: 'women_only', label: 'Ayollar uchun', icon: '👩' },
  { key: 'ac', label: 'Konditsioner', icon: '❄️' },
]

type View = 'home' | 'form' | 'waiting' | 'applicants' | 'confirmed'

function formatPreference(key: PassengerPreference) {
  return PREFS.find((pref) => pref.key === key)?.label ?? key
}

function routeLabel(request: PassengerRequest) {
  const destination = getRegion(request.destinationRegionId)?.nameUz ?? ''
  return `${request.origin.labelUz} -> ${destination}`
}

function departureRank(label: DriverApplication['departureWindowLabelUz']) {
  return label === 'Hozir' ? 0 : label === '30 daqiqada' ? 1 : label === '1 soatda' ? 2 : 3
}

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
  const { state, actions } = useDrivee()
  const [view, setView] = useState<View>('home')
  const [destinationRegionId, setDestinationRegionId] = useState<RegionId>('toshkent')
  const [preferences, setPreferences] = useState<PassengerPreference[]>(['non_smoking'])
  const [dateISO, setDateISO] = useState(() => new Date().toISOString().slice(0, 10))
  const [timeApprox, setTimeApprox] = useState('10:00')
  const [seats, setSeats] = useState(1)

  const originLabel = state.location?.labelUz ?? "Joylashuv tanlanmagan"
  const requests = useMemo(() => state.requests.filter((request) => request.status !== 'cancelled'), [state.requests])
  const latest = requests[0] ?? null
  const selectedDriver = latest?.selectedDriverId
    ? state.drivers.find((driver) => driver.id === latest.selectedDriverId)
    : null
  const selectedOffer = latest?.selectedDriverId
    ? latest.applicants.find((app) => app.driverId === latest.selectedDriverId)
    : null

  const sortedApplicants = useMemo(() => {
    if (!latest) return []

    return latest.applicants
      .map((application) => ({
        application,
        driver: state.drivers.find((driver) => driver.id === application.driverId),
      }))
      .filter((row): row is { application: DriverApplication; driver: NonNullable<typeof row.driver> } => Boolean(row.driver))
      .sort((a, b) => {
        const ratingDelta = b.driver.rating.avg - a.driver.rating.avg
        if (ratingDelta !== 0) return ratingDelta

        return departureRank(a.application.departureWindowLabelUz) - departureRank(b.application.departureWindowLabelUz)
      })
  }, [latest, state.drivers])

  function submitRequest() {
    onCreate({ destinationRegionId, dateISO, timeApprox, seats, preferences })
    hapticImpact('medium')
    setView('waiting')
  }

  if (view === 'form') {
    return (
      <div className="screen-enter pb-4 pt-2">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <Chip className="border-brand-blue/20 bg-brand-blue/5 text-brand-blue">
              <MapPin className="h-4 w-4" />
              {originLabel}
            </Chip>
            <h2 className="mt-3 text-2xl font-black text-brand-ink">Safar so'rovi</h2>
          </div>
          <button
            type="button"
            onClick={() => setView('home')}
            className="rounded-lg border border-brand-line bg-white px-3 py-2 text-xs font-black text-brand-ink"
          >
            Ortga
          </button>
        </div>

        <Card className="p-5">
          <label className="block text-xs font-extrabold text-brand-ink" htmlFor="destination">
            Manzil viloyati
          </label>
          <select
            id="destination"
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

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-extrabold text-brand-ink">Sana</span>
              <input
                type="date"
                value={dateISO}
                onChange={(event) => setDateISO(event.target.value)}
                className="mt-2 w-full rounded-lg border border-brand-line bg-white px-3 py-3 text-sm font-bold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
              />
            </label>
            <label className="block">
              <span className="text-xs font-extrabold text-brand-ink">Taxminiy vaqt</span>
              <input
                type="time"
                value={timeApprox}
                onChange={(event) => setTimeApprox(event.target.value)}
                className="mt-2 w-full rounded-lg border border-brand-line bg-white px-3 py-3 text-sm font-bold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
              />
            </label>
          </div>

          <div className="mt-4">
            <div className="text-xs font-extrabold text-brand-ink">O'rindiqlar</div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    hapticSelection()
                    setSeats(count)
                  }}
                  className={cn(
                    'rounded-lg border px-0 py-3 text-sm font-black transition active:scale-[0.99]',
                    seats === count
                      ? 'border-brand-blue bg-brand-blue text-white'
                      : 'border-brand-line bg-white text-brand-ink',
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-extrabold text-brand-ink">Afzalliklar</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {PREFS.map((preference) => {
                const active = preferences.includes(preference.key)

                return (
                  <button
                    key={preference.key}
                    type="button"
                    onClick={() => {
                      hapticSelection()
                      setPreferences((current) =>
                        current.includes(preference.key)
                          ? current.filter((item) => item !== preference.key)
                          : [...current, preference.key],
                      )
                    }}
                    className={cn(
                      'rounded-full border px-3 py-2 text-xs font-black transition active:scale-[0.99]',
                      active
                        ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                        : 'border-brand-line bg-white text-brand-ink',
                    )}
                  >
                    {preference.icon} {preference.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5">
            <PrimaryButton type="button" onClick={submitRequest}>
              So'rov yuborish
            </PrimaryButton>
          </div>
        </Card>
      </div>
    )
  }

  if (view === 'waiting') {
    return (
      <div className="screen-enter pb-4 pt-2">
        <Card className="p-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
            <Clock3 className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-black text-brand-ink">So'rov yuborildi</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-brand-muted">
            Mos haydovchilar faqat sizning tumaningizdan chiqadi. Arizalar kelganda shu yerda ko'rasiz.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <SecondaryButton type="button" onClick={() => setView('home')}>
              Bosh sahifa
            </SecondaryButton>
            <PrimaryButton type="button" onClick={() => setView('applicants')} disabled={!latest?.applicants.length}>
              Arizalar
            </PrimaryButton>
          </div>
        </Card>
      </div>
    )
  }

  if ((view === 'confirmed' || latest?.status === 'confirmed') && latest && selectedDriver && selectedOffer) {
    return (
      <div className="screen-enter pb-4 pt-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <div className="text-lg font-black text-brand-ink">Haydovchi tanlandi</div>
              <div className="mt-1 text-sm font-semibold text-brand-muted">{routeLabel(latest)}</div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-brand-line bg-brand-soft/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue text-sm font-black text-white">
                {selectedDriver.initials}
              </div>
              <div className="flex-1">
                <div className="font-black text-brand-ink">{selectedDriver.name}</div>
                <div className="text-sm font-semibold text-brand-muted">
                  {selectedDriver.carModel}, {selectedDriver.carYear}
                </div>
              </div>
              <div className="text-right text-sm font-black text-brand-blue">
                {selectedOffer.pricePerSeat.toLocaleString('uz-UZ')} so'm
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-700">
              <Phone className="h-4 w-4" />
              {selectedDriver.phone}
            </div>
          </div>

          <div className="mt-5">
            <SecondaryButton type="button" onClick={() => setView('home')}>
              Bosh sahifaga qaytish
            </SecondaryButton>
          </div>
        </Card>
      </div>
    )
  }

  if (view === 'applicants' && latest) {
    return (
      <div className="screen-enter pb-4 pt-2">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-muted">
              Haydovchilar
            </div>
            <h2 className="mt-1 text-2xl font-black text-brand-ink">{latest.applicants.length} ta ariza</h2>
          </div>
          <button
            type="button"
            onClick={() => setView('home')}
            className="rounded-lg border border-brand-line bg-white px-3 py-2 text-xs font-black text-brand-ink"
          >
            Ortga
          </button>
        </div>

        <div className="space-y-3">
          {sortedApplicants.length === 0 ? (
            <Card className="p-5">
              <div className="text-lg font-black text-brand-ink">Hozircha ariza yo'q</div>
              <div className="mt-2 text-sm font-semibold text-brand-muted">
                Mos haydovchilar ariza berganda shu yerda chiqadi.
              </div>
            </Card>
          ) : (
            sortedApplicants.map(({ application, driver }) => (
              <Card key={application.id} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue text-sm font-black text-white">
                    {driver.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-black text-brand-ink">{driver.name}</div>
                        <div className="text-sm font-semibold text-brand-muted">
                          {driver.carModel}, {driver.carYear}
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
                      {driver.badges.map((badge) => (
                        <span key={badge} className="rounded-full bg-brand-soft px-2 py-1 text-[11px] font-black text-brand-ink">
                          {badge === 'verified' ? '✓ Tasdiqlangan' : badge === 'clean' ? '✦ Toza' : "⏱ O'z vaqtida"}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-brand-soft/50 px-3 py-2">
                        <div className="text-[11px] font-bold text-brand-muted">Narx</div>
                        <div className="font-black text-brand-ink">{application.pricePerSeat.toLocaleString('uz-UZ')} so'm</div>
                      </div>
                      <div className="rounded-lg bg-brand-soft/50 px-3 py-2">
                        <div className="text-[11px] font-bold text-brand-muted">Ketish</div>
                        <div className="font-black text-brand-ink">{application.departureWindowLabelUz}</div>
                      </div>
                    </div>
                    {application.note ? (
                      <div className="mt-3 rounded-lg border border-brand-line px-3 py-2 text-sm font-semibold text-brand-muted">
                        {application.note}
                      </div>
                    ) : null}
                    <div className="mt-4">
                      <PrimaryButton
                        type="button"
                        onClick={() => {
                          actions.selectDriverForRequest(latest.id, driver.id)
                          hapticImpact('medium')
                          setView('confirmed')
                        }}
                      >
                        Tanlash <ArrowRight className="ml-1 inline h-4 w-4" />
                      </PrimaryButton>
                    </div>
                  </div>
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
      <div className="px-1">
        <Chip className="border-brand-blue/20 bg-brand-blue/5 text-brand-blue">
          <MapPin className="h-4 w-4" />
          {originLabel}
        </Chip>
      </div>

      <div className="mt-4 space-y-3">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-muted">
                Bosh sahifa
              </div>
              <h2 className="mt-2 text-xl font-black text-brand-ink">Qayerga borasiz?</h2>
              <p className="mt-2 text-sm font-semibold text-brand-muted">
                Safar so'rovini uch qadamda yuboring.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <Plus className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-5">
            <PrimaryButton type="button" onClick={() => setView('form')}>
              So'rov yuborish
            </PrimaryButton>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-muted">
                Faol ariza
              </div>
              <div className="mt-2 text-base font-black text-brand-ink">
                {latest ? routeLabel(latest) : "Hozircha ariza yo'q"}
              </div>
              <div className="mt-1 text-sm font-semibold text-brand-muted">
                {latest
                  ? `${latest.dateISO} • ${latest.timeApprox} • ${latest.seats} ta o'rin`
                  : "Yangi so'rov yuboring, haydovchilar ariza beradi."}
              </div>
            </div>
            {latest ? (
              <div className="rounded-lg border border-brand-blue/20 bg-brand-blue/10 px-3 py-2 text-right">
                <div className="text-xs font-black text-brand-blue">{latest.applicants.length} ta haydovchi</div>
                {latest.applicants.length > 0 ? (
                  <div className="mt-1 inline-flex rounded-full bg-brand-blue px-2 py-1 text-[10px] font-black text-white">
                    NEW
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {latest ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SecondaryButton type="button" onClick={() => setView('waiting')}>
                Holat
              </SecondaryButton>
              <PrimaryButton type="button" disabled={latest.applicants.length === 0} onClick={() => setView('applicants')}>
                Arizalar
              </PrimaryButton>
            </div>
          ) : null}
        </Card>

        <Card className="p-4">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-brand-muted">Afzalliklar</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {PREFS.map((preference) => (
              <span key={preference.key} className="rounded-full bg-white px-3 py-2 text-xs font-black text-brand-ink ring-1 ring-brand-line">
                {preference.icon} {preference.label}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export { formatPreference }
