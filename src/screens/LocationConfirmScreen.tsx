import { useEffect, useMemo, useState } from 'react'
import { LocateFixed, MapPin, RefreshCw } from 'lucide-react'
import { Card, PrimaryButton, SecondaryButton } from '../components/ui'
import { REGIONS, getDistrict, getRegion } from '../data/uzbekistan'
import { useDrivee } from '../contexts/DriveeContext'
import { buildLocationLabelUz } from '../state/driveeStore'
import type { DistrictId, RegionId, UserLocation } from '../types/drivee'
import { hapticNotify, isTelegramMiniApp, requestTelegramLocation } from '../utils/telegram'

type Step = 'loading' | 'confirm' | 'manual'

type NominatimAddress = {
  state?: string
  region?: string
  county?: string
  state_district?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  district?: string
  suburb?: string
}

type NominatimReverseResponse = {
  address?: NominatimAddress
  display_name?: string
}

const REGION_MATCHERS: Record<RegionId, string[]> = {
  toshkent: ['toshkent', 'tashkent'],
  samarkand: ['samarqand', 'samarkand'],
  fargona: ["farg'ona", 'fargona', 'fergana'],
  buxoro: ['buxoro', 'bukhara'],
  namangan: ['namangan'],
  andijon: ['andijon', 'andijan'],
  qashqadaryo: ['qashqadaryo', 'kashkadarya', 'qarshi'],
}

const DISTRICT_MATCHERS: Record<DistrictId, string[]> = {
  'samarkand-markaz': ['markaz', 'samarqand city', 'samarkand city'],
  'samarkand-juma': ['juma', 'pastdargom', 'past dargom'],
  'samarkand-urgut': ['urgut'],
  'samarkand-kattaqorgon': ["kattaqo'rg'on", 'kattaqorgon', 'katta-kurgan', 'kattakurgan'],
  'fargona-markaz': ['markaz', 'fargona city', 'fergana city'],
  'fargona-qoqon': ["qo'qon", 'qoqon', 'kokand'],
  'fargona-margilon': ["marg'ilon", 'margilon', 'margilan'],
  'fargona-rishton': ['rishton', 'rishtan'],
  'buxoro-markaz': ['markaz', 'buxoro city', 'bukhara city'],
  'buxoro-gijduvon': ["g'ijduvon", 'gijduvon', 'gijduvan'],
  'buxoro-vobkent': ['vobkent', 'vabkent'],
  'namangan-markaz': ['markaz', 'namangan city'],
  'namangan-chust': ['chust'],
  'namangan-pop': ['pop', 'pap'],
  'andijon-markaz': ['markaz', 'andijon city', 'andijan city'],
  'andijon-asaka': ['asaka'],
  'andijon-shahrixon': ['shahrixon', 'shahrikhan'],
  'qashqadaryo-markaz': ['markaz', 'qarshi', 'karshi'],
  'qashqadaryo-shahrisabz': ['shahrisabz'],
  'qashqadaryo-kitob': ['kitob', 'kitab'],
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[ʻ‘’`]/g, "'")
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function collectAddressText(address: NominatimAddress, displayName?: string) {
  return [
    address.state,
    address.region,
    address.county,
    address.state_district,
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.district,
    address.suburb,
    displayName,
  ]
    .filter((item): item is string => Boolean(item))
    .map(normalize)
    .join(' ')
}

function matchRegion(text: string): RegionId | null {
  for (const region of REGIONS) {
    const aliases = REGION_MATCHERS[region.id]
    if (aliases.some((alias) => text.includes(normalize(alias)))) return region.id
  }

  return null
}

function matchDistrict(text: string, regionId: RegionId): DistrictId | undefined {
  const region = getRegion(regionId)
  if (!region || region.mode === 'zones') return undefined

  for (const district of region.districts) {
    const aliases = DISTRICT_MATCHERS[district.id] ?? [district.nameUz]
    if (aliases.some((alias) => text.includes(normalize(alias)))) return district.id
  }

  return undefined
}

async function reverseGeocodeLocation(latitude: number, longitude: number): Promise<UserLocation> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'json',
    'accept-language': 'uz',
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error("Joylashuv aniqlanmadi. Tumaningizni qo'lda tanlang.")
  }

  const payload = (await response.json()) as NominatimReverseResponse
  const address = payload.address
  if (!address) {
    throw new Error("Joylashuv aniqlanmadi. Tumaningizni qo'lda tanlang.")
  }

  const text = collectAddressText(address, payload.display_name)
  const regionId = matchRegion(text)
  if (!regionId) {
    throw new Error("Bu hudud MVP ro'yxatida yo'q. Tumaningizni qo'lda tanlang.")
  }

  const districtId = matchDistrict(text, regionId)
  const region = getRegion(regionId)
  if (region?.mode === 'tuman_match' && !districtId) {
    throw new Error("Tuman aniqlanmadi. Tumaningizni qo'lda tanlang.")
  }

  const location = { regionId, districtId }

  return {
    ...location,
    labelUz: buildLocationLabelUz(location),
    source: 'gps',
  }
}

export default function LocationConfirmScreen() {
  const { actions } = useDrivee()
  const [step, setStep] = useState<Step>('loading')
  const [detected, setDetected] = useState<UserLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualRegionId, setManualRegionId] = useState<RegionId>('samarkand')
  const [manualDistrictId, setManualDistrictId] = useState('samarkand-juma')

  const manualRegion = useMemo(() => getRegion(manualRegionId), [manualRegionId])
  const manualDistricts = manualRegion?.districts ?? []

  useEffect(() => {
    let active = true

    async function detectLocation() {
      if (!isTelegramMiniApp()) {
        setError("Brauzerda GPS o'rniga tumaningizni qo'lda tanlang.")
        setStep('manual')
        return
      }

      setStep('loading')
      setError(null)

      try {
        const telegramLocation = await requestTelegramLocation()
        if (!active) return

        if (
          typeof telegramLocation.latitude !== 'number' ||
          typeof telegramLocation.longitude !== 'number'
        ) {
          throw new Error("GPS ma'lumoti olinmadi. Tumaningizni qo'lda tanlang.")
        }

        const userLocation = await reverseGeocodeLocation(
          telegramLocation.latitude,
          telegramLocation.longitude,
        )

        if (!active) return
        setDetected(userLocation)
        setStep('confirm')
      } catch (caught) {
        if (!active) return
        setError(caught instanceof Error ? caught.message : "Ulanishda xato. Qayta urinib ko'ring.")
        setStep('manual')
      }
    }

    void detectLocation()

    return () => {
      active = false
    }
  }, [])

  function saveManualLocation() {
    const region = getRegion(manualRegionId)
    const district = region?.mode === 'tuman_match' ? getDistrict(manualDistrictId) : null
    const location = {
      regionId: manualRegionId,
      districtId: district?.id,
    }

    const next: UserLocation = {
      ...location,
      labelUz: buildLocationLabelUz(location),
      source: 'manual',
    }

    actions.setLocation(next)
    hapticNotify('success')
  }

  function confirmDetectedLocation() {
    if (!detected) return
    actions.setLocation(detected)
    hapticNotify('success')
  }

  return (
    <div className="screen-enter min-h-screen bg-brand-bg px-4 pb-6 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div>
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-muted">
          Joylashuv
        </div>
        <h1 className="mt-2 text-2xl font-black tracking-normal text-brand-ink">
          Tumaningizni tasdiqlang
        </h1>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-brand-muted">
          Drivee haydovchi va yo'lovchini shahar bo'yicha emas, aynan tuman bo'yicha moslaydi.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {step === 'loading' ? (
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                <RefreshCw className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <div className="text-base font-black text-brand-ink">
                  📡 Joylashuvingiz aniqlanmoqda...
                </div>
                <div className="mt-1 text-sm font-semibold text-brand-muted">
                  Telegram GPS ruxsatini so'raydi.
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {step === 'confirm' && detected ? (
          <Card className="p-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-3 py-2 text-xs font-extrabold text-brand-blue">
              <MapPin className="h-4 w-4" />
              📍 {detected.labelUz} — bu to'g'rimi?
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <PrimaryButton type="button" onClick={confirmDetectedLocation}>
                Ha, to'g'ri ✓
              </PrimaryButton>
              <SecondaryButton type="button" onClick={() => setStep('manual')}>
                O'zgartirish
              </SecondaryButton>
            </div>
          </Card>
        ) : null}

        {step === 'manual' ? (
          <Card className="p-5">
            {error ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex items-center gap-2 text-sm font-black text-brand-ink">
              <LocateFixed className="h-4 w-4 text-brand-blue" />
              Viloyat va tuman
            </div>

            <label className="mt-4 block text-xs font-extrabold text-brand-ink" htmlFor="region">
              Viloyat
            </label>
            <select
              id="region"
              value={manualRegionId}
              onChange={(event) => {
                const next = event.target.value as RegionId
                const firstDistrict = getRegion(next)?.districts[0]?.id ?? ''
                setManualRegionId(next)
                setManualDistrictId(firstDistrict)
              }}
              className="mt-2 w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm font-bold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
            >
              {REGIONS.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.nameUz}
                </option>
              ))}
            </select>

            {manualRegion?.mode === 'tuman_match' ? (
              <>
                <label className="mt-4 block text-xs font-extrabold text-brand-ink" htmlFor="district">
                  Tuman
                </label>
                <select
                  id="district"
                  value={manualDistrictId}
                  onChange={(event) => setManualDistrictId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm font-bold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
                >
                  {manualDistricts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.nameUz} tumani
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <div className="mt-4 rounded-lg border border-brand-line bg-brand-soft/40 px-4 py-3 text-sm font-semibold text-brand-muted">
                Toshkent ichida tuman emas, pickup/dropoff zonalari ishlatiladi.
              </div>
            )}

            <div className="mt-5">
              <PrimaryButton
                type="button"
                disabled={manualRegion?.mode === 'tuman_match' && !manualDistrictId}
                onClick={saveManualLocation}
              >
                Saqlash
              </PrimaryButton>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
