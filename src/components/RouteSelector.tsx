import { routeLabels } from '../data/mock'
import type { RouteId } from '../types/drivee'

type RouteSelectorProps = {
  label?: string
  value: RouteId
  onChange: (next: RouteId) => void
}

export default function RouteSelector({
  label = "Yo'nalish",
  value,
  onChange,
}: RouteSelectorProps) {
  return (
    <section className="rounded-[28px] border border-brand-line bg-white p-4 shadow-soft">
      <div className="text-sm font-semibold text-brand-ink">{label}</div>
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-[24px] bg-brand-soft p-1.5">
        <button
          type="button"
          onClick={() => onChange('kokand-tashkent')}
          className={
            value === 'kokand-tashkent'
              ? 'rounded-[20px] bg-brand-blue px-3 py-3 text-center text-sm font-semibold text-white shadow-soft transition'
              : 'rounded-[20px] px-3 py-3 text-center text-sm font-semibold text-brand-ink transition'
          }
          aria-pressed={value === 'kokand-tashkent'}
        >
          {routeLabels['kokand-tashkent']}
        </button>
        <button
          type="button"
          onClick={() => onChange('tashkent-kokand')}
          className={
            value === 'tashkent-kokand'
              ? 'rounded-[20px] bg-brand-blue px-3 py-3 text-center text-sm font-semibold text-white shadow-soft transition'
              : 'rounded-[20px] px-3 py-3 text-center text-sm font-semibold text-brand-ink transition'
          }
          aria-pressed={value === 'tashkent-kokand'}
        >
          {routeLabels['tashkent-kokand']}
        </button>
      </div>
    </section>
  )
}
