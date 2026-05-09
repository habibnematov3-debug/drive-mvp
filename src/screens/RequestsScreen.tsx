import { useMemo } from 'react'
import { Card, PrimaryButton } from '../components/ui'
import { useDrivee } from '../contexts/DriveeContext'
import { getRegion } from '../data/uzbekistan'

export default function RequestsScreen() {
  const { state, actions } = useDrivee()

  const myDistrict = state.location?.districtId

  const passengerRequests = useMemo(() => state.requests, [state.requests])
  const driverIncoming = useMemo(() => {
    if (!myDistrict) return []
    return state.requests.filter((r) => r.status === 'active' && r.origin.districtId === myDistrict)
  }, [myDistrict, state.requests])

  if (state.role === 'driver') {
    return (
      <div className="screen-enter pb-4 pt-2">
        <div className="px-1">
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-muted">
            Arizalar
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-brand-ink">
            Kelayotgan so&apos;rovlar
          </h2>
        </div>

        <div className="mt-4 space-y-3 px-1">
          {driverIncoming.length === 0 ? (
            <Card className="p-5">
              <div className="text-lg font-black text-brand-ink">Hozircha mos so‘rov yo‘q</div>
              <div className="mt-2 text-sm font-semibold text-brand-muted">
                Tuman bo&apos;yicha mos keladigan yo&apos;lovchi so&apos;rovlari shu yerda chiqadi.
              </div>
            </Card>
          ) : (
            driverIncoming.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="text-base font-black text-brand-ink">
                  {getRegion(r.origin.regionId)?.nameUz ?? ''} → {getRegion(r.destinationRegionId)?.nameUz ?? ''}
                </div>
                <div className="mt-1 text-sm font-semibold text-brand-muted">
                  {r.dateISO} • {r.timeApprox} • {r.seats} ta o‘rin
                </div>
                <div className="mt-4">
                  <PrimaryButton
                    type="button"
                    onClick={() => {
                      actions.applyToRequestAsDriver(r.id, {
                        driverId: 'drv_1',
                        pricePerSeat: 60000,
                        departureWindowLabelUz: '30 daqiqada',
                        note: "Yo'lga chiqayapman.",
                      })
                    }}
                  >
                    Qabul qilish ✓
                  </PrimaryButton>
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
        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-muted">
          Arizalar
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-brand-ink">
          Mening so&apos;rovlarim
        </h2>
      </div>

      <div className="mt-4 space-y-3 px-1">
        {passengerRequests.length === 0 ? (
          <Card className="p-5">
            <div className="text-lg font-black text-brand-ink">Hozircha so‘rov yuborilmagan</div>
            <div className="mt-2 text-sm font-semibold text-brand-muted">
              Bosh sahifadan so‘rov yuboring — haydovchilar ariza beradi.
            </div>
          </Card>
        ) : (
          passengerRequests.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-black text-brand-ink">
                    {getRegion(r.origin.regionId)?.nameUz ?? ''} → {getRegion(r.destinationRegionId)?.nameUz ?? ''}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-brand-muted">
                    {r.dateISO} • {r.timeApprox} • {r.seats} ta o‘rin
                  </div>
                </div>
                <div className="rounded-[16px] border border-brand-blue/20 bg-brand-blue/10 px-3 py-2 text-right">
                  <div className="text-xs font-black text-brand-blue">{r.applicants.length} ta</div>
                  <div className="mt-1 text-[10px] font-black text-brand-muted">haydovchi</div>
                </div>
              </div>

              {r.applicants.length === 0 ? (
                <div className="mt-4 rounded-[18px] border border-brand-line bg-brand-soft/30 px-4 py-3 text-sm font-semibold text-brand-muted">
                  Hozircha haydovchilar ariza bermadi.
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {r.applicants
                    .slice()
                    .sort((a, b) => b.pricePerSeat - a.pricePerSeat)
                    .map((a) => (
                      <div
                        key={a.id}
                        className="rounded-[20px] border border-brand-line bg-white px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-black text-brand-ink">
                            Taklif: {a.pricePerSeat.toLocaleString('uz-UZ')} so‘m
                          </div>
                          <div className="text-xs font-black text-brand-blue">{a.departureWindowLabelUz}</div>
                        </div>
                        {a.note ? (
                          <div className="mt-1 text-xs font-semibold text-brand-muted">{a.note}</div>
                        ) : null}
                        <div className="mt-3">
                          <PrimaryButton
                            type="button"
                            onClick={() => actions.selectDriverForRequest(r.id, a.driverId)}
                          >
                            Tanlash →
                          </PrimaryButton>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

