import { useEffect, useMemo, useState } from 'react'
import { LocateFixed, MapPin, RefreshCw } from 'lucide-react'
import { Card, Chip, PrimaryButton, SecondaryButton } from '../components/ui'
import { REGIONS, getDistrict, getRegion } from '../data/uzbekistan'
import { useDrivee } from '../contexts/DriveeContext'
import { buildLocationLabelUz } from '../state/driveeStore'
import type { RegionId, UserLocation } from '../types/drivee'
import { hapticNotify, requestTelegramLocation } from '../utils/telegram'

type Step = 'loading' | 'confirm' | 'manual'

function reverseGeocodeForDemo(_latitude: number, _longitude: number): UserLocation {
  const hit = { regionId: 'samarkand' as const, districtId: 'samarkand-juma' }

  return {
    ...hit,
    labelUz: buildLocationLabelUz(hit),
    source: 'gps',
  }
}

export default function LocationConfirmScreen() {
  const { state, actions } = useDrivee()
  const [step, setStep] = useState<Step>('loading')
  const [detected, setDetected] = useState<UserLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualRegionId, setManualRegionId] = useState<RegionId>('samarkand')
  const [manualDistrictId, setManualDistrictId] = useState('samarkand-juma')

  const roleLabel = state.role === 'driver' ? 'Men hozir:' : 'Siz hozir:'
  const manualRegion = useMemo(() => getRegion(manualRegionId), [manualRegionId])
  const manualDistricts = manualRegion?.districts ?? []

  useEffect(() => {
    let active = true

    async function detectLocation() {
      setStep('loading')
      setError(null)

      try {
        const location = await requestTelegramLocation()
        if (!active) return
        setDetected(reverseGeocodeForDemo(location.latitude!, location.longitude!))
        setStep('confirm')
      } catch {
        if (!active) return
        setError("GPS ishlamadi. Tumaningizni qo'lda tanlang.")
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
                <div className="text-base font-black text-brand-ink">GPS tekshirilmoqda</div>
                <div className="mt-1 text-sm font-semibold text-brand-muted">
                  Telegram joylashuvingizni so'rayapti.
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {step === 'confirm' && detected ? (
          <Card className="p-5">
            <Chip className="border-brand-blue/20 bg-brand-blue/5 text-brand-blue">
              <MapPin className="h-4 w-4" />
              {roleLabel} <span className="font-black">{detected.labelUz}</span>
            </Chip>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <PrimaryButton
                type="button"
                onClick={() => {
                  actions.setLocation(detected)
                  hapticNotify('success')
                }}
              >
                Tasdiqlash
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
