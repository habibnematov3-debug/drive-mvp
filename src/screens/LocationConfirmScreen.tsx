import { useEffect, useMemo, useState } from 'react'
import { REGIONS, getDistrict, getRegion } from '../data/uzbekistan'
import { useDrivee } from '../contexts/DriveeContext'
import { buildLocationLabelUz } from '../state/driveeStore'
import { Card, Chip, PrimaryButton, SecondaryButton } from '../components/ui'
import { hapticNotify, requestTelegramLocation } from '../utils/telegram'
import type { RegionId } from '../types/drivee'

type Step = 'loading' | 'confirm' | 'manual' | 'error'

function fakeReverseGeocodeToMvpDistrict(_lat: number, _lng: number) {
  // MVP stub: we can’t reliably reverse-geocode Uzbek tuman names offline.
  // We default to Samarqand/Juma for demo; user can correct manually.
  return { regionId: 'samarkand' as const, districtId: 'samarkand-juma' as const }
}

export default function LocationConfirmScreen() {
  const { state, actions } = useDrivee()
  const [step, setStep] = useState<Step>('loading')
  const [error, setError] = useState<string | null>(null)
  const [manualRegionId, setManualRegionId] = useState<RegionId>('samarkand')
  const [manualDistrictId, setManualDistrictId] = useState<string>('samarkand-juma')

  const manualRegion = useMemo(() => getRegion(manualRegionId), [manualRegionId])
  const manualDistricts = manualRegion?.districts ?? []

  useEffect(() => {
    let active = true

    async function run() {
      setStep('loading')
      setError(null)

      try {
        const loc = await requestTelegramLocation()
        if (!active) return
        const hit = fakeReverseGeocodeToMvpDistrict(loc.latitude!, loc.longitude!)
        const labelUz = buildLocationLabelUz(hit)
        actions.setLocation({ ...hit, labelUz, source: 'gps' })
        setStep('confirm')
      } catch (e) {
        if (!active) return
        const msg = e instanceof Error ? e.message : "GPS ishlamadi. Tumaningizni qo'lda tanlang."
        setError(msg)
        setStep('manual')
      }
    }

    void run()
    return () => {
      active = false
    }
  }, [actions])

  const currentLabel = state.location?.labelUz ?? ''

  return (
    <div className="screen-enter pb-2 pt-3">
      <div className="px-1">
        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-muted">
          Joylashuv
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-brand-ink">
          Tumaningizni tasdiqlang
        </h2>
        <p className="mt-2 max-w-[310px] text-sm font-semibold leading-relaxed text-brand-muted">
          Drivee tuman bo&apos;yicha moslaydi. Haydovchi va yo&apos;lovchi faqat bir xil tuman
          bo&apos;lsa ko&apos;rinadi.
        </p>
      </div>

      <div className="mt-5 space-y-3 px-1">
        {step === 'loading' ? (
          <Card className="p-5">
            <div className="h-4 w-40 animate-pulse rounded bg-brand-soft" />
            <div className="mt-3 h-10 w-full animate-pulse rounded-[18px] bg-brand-soft" />
            <div className="mt-3 h-10 w-full animate-pulse rounded-[18px] bg-brand-soft" />
          </Card>
        ) : step === 'confirm' ? (
          <Card className="p-5">
            <Chip className="border-brand-blue/20 bg-brand-blue/5 text-brand-blue">
              📍 Siz hozir: <span className="font-black">{currentLabel}</span>
            </Chip>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <PrimaryButton
                type="button"
                onClick={() => {
                  hapticNotify('success')
                  // already in state, proceed (App will gate automatically)
                }}
              >
                Tasdiqlash
              </PrimaryButton>
              <SecondaryButton
                type="button"
                onClick={() => {
                  setStep('manual')
                }}
              >
                O&apos;zgartirish
              </SecondaryButton>
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            {error ? (
              <div className="mb-4 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <div className="text-sm font-black text-brand-ink">Viloyat</div>
            <select
              value={manualRegionId}
              onChange={(e) => {
                const next = e.target.value as RegionId
                setManualRegionId(next)
                const firstDistrict = (getRegion(next)?.districts?.[0]?.id ?? '') as string
                setManualDistrictId(firstDistrict)
              }}
              className="mt-2 w-full rounded-[18px] border border-brand-line bg-white px-4 py-3 text-sm font-bold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameUz}
                </option>
              ))}
            </select>

            {manualRegion?.mode === 'tuman_match' ? (
              <>
                <div className="mt-4 text-sm font-black text-brand-ink">Tuman</div>
                <select
                  value={manualDistrictId}
                  onChange={(e) => setManualDistrictId(e.target.value)}
                  className="mt-2 w-full rounded-[18px] border border-brand-line bg-white px-4 py-3 text-sm font-bold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
                >
                  {manualDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameUz} tumani
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <div className="mt-4 rounded-[18px] border border-brand-line bg-brand-soft/30 px-4 py-3 text-sm font-semibold text-brand-muted">
                Toshkentda tuman bo&apos;yicha moslash yo&apos;q — zonalar bo&apos;yicha ishlaydi.
              </div>
            )}

            <div className="mt-5">
              <PrimaryButton
                type="button"
                onClick={() => {
                  const region = getRegion(manualRegionId)
                  const district =
                    region?.mode === 'tuman_match' ? getDistrict(manualDistrictId) : null
                  const location = {
                    regionId: manualRegionId,
                    districtId: district?.id,
                  }
                  const labelUz = buildLocationLabelUz(location)
                  actions.setLocation({ ...location, labelUz, source: 'manual' })
                  hapticNotify('success')
                  setStep('confirm')
                }}
                disabled={manualRegion?.mode === 'tuman_match' && !manualDistrictId}
              >
                Saqlash
              </PrimaryButton>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

