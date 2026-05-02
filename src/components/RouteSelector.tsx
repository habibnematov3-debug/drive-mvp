import { useLanguage } from '../contexts/LanguageContext'
import type { RouteId } from '../types/drivee'

type RouteSelectorProps = {
  label?: string
  value: RouteId
  onChange: (next: RouteId) => void
}

type RouteOption = {
  id: RouteId
  labelKey: string
}

const ROUTE_OPTIONS: RouteOption[] = [
  { id: 'kokand-tashkent', labelKey: 'routes.kokandTashkent' },
  { id: 'tashkent-kokand', labelKey: 'routes.tashkentKokand' },
  { id: 'tashkent-samarkand', labelKey: 'routes.tashkentSamarkand' },
  { id: 'samarkand-tashkent', labelKey: 'routes.samarkandTashkent' },
  { id: 'tashkent-namangan', labelKey: 'routes.tashkentNamangan' },
  { id: 'namangan-tashkent', labelKey: 'routes.namanganTashkent' },
]

export default function RouteSelector({
  label,
  value,
  onChange,
}: RouteSelectorProps) {
  const { t } = useLanguage()
  const resolvedLabel = label ?? t('home.route')

  return (
    <section className="rounded-[32px] border border-brand-line bg-white p-4 shadow-soft">
      <label className="block text-[1.05rem] font-semibold text-brand-ink">
        {resolvedLabel}
      </label>
      <div className="relative mt-3">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as RouteId)}
          className="w-full appearance-none rounded-[22px] border border-brand-line bg-white py-3 pl-4 pr-10 text-sm font-semibold text-brand-ink outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
        >
          {ROUTE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-brand-muted">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </section>
  )
}
