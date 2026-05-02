import { useLanguage } from '../contexts/LanguageContext'
import type { RequestStatus, RideRequest, RouteId } from '../types/drivee'
import {
  formatDateUz,
  formatPassengerCount,
  formatPassengerGender,
} from '../utils/format'

type OrderCardProps = {
  order: RideRequest
}

const ROUTE_TITLE_KEYS: Record<RouteId, string> = {
  'kokand-tashkent': 'routes.kokandTashkent',
  'tashkent-kokand': 'routes.tashkentKokand',
  'tashkent-samarkand': 'routes.tashkentSamarkand',
  'samarkand-tashkent': 'routes.samarkandTashkent',
  'tashkent-namangan': 'routes.tashkentNamangan',
  'namangan-tashkent': 'routes.namanganTashkent',
}

function formatDisplayId(id: string) {
  const normalized = String(id || '').trim()
  if (!normalized) return ''

  const compact = normalized.replace(/^AR-/, '')
  return `AR-${compact.slice(-6).toUpperCase()}`
}

function StatusBadge({
  status,
  t,
}: {
  status: RequestStatus
  t: (key: string) => string
}) {
  const config: Record<string, { label: string; color: string }> = {
    submitted: {
      label: t('status.submitted'),
      color: 'bg-brand-blue/15 text-brand-blue border-brand-blue/30',
    },
    matched: {
      label: t('status.matched'),
      color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    },
    cancelled: {
      label: t('status.cancelled'),
      color: 'bg-red-500/15 text-red-600 border-red-500/30',
    },
  }

  const { label, color } = config[status] ?? config.submitted

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] items-center font-bold uppercase tracking-wider ${color}`}
    >
      {label}
    </span>
  )
}

export default function OrderCard({ order }: OrderCardProps) {
  const { language, t } = useLanguage()
  const routeTitle = t(ROUTE_TITLE_KEYS[order.routeId] || 'routes.kokandTashkent')

  const createdAtDate = order.createdAtISO
    ? new Date(order.createdAtISO).toLocaleDateString(
        language === 'ru' ? 'ru-RU' : 'uz-UZ',
      )
    : ''

  return (
    <article className="rounded-[28px] border border-brand-line bg-white p-4 transition-colors hover:border-brand-blue/30 shadow-soft m-3 mb-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className="flex-shrink-0 text-brand-blue"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span className="truncate text-base font-bold text-brand-ink">
            {routeTitle}
          </span>
        </div>
        <StatusBadge status={order.status} t={t} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-brand-muted">
        <span className="flex items-center gap-1">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatDateUz(order.dateISO, language)}
        </span>
        <span className="flex items-center gap-1">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {order.time}
        </span>
        <span className="flex items-center gap-1">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {formatPassengerCount(order.passengerCount, t)}
        </span>
        {order.fullCar ? (
          <span className="text-brand-blue font-bold">{t('orders.fullCar')}</span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-brand-muted">
        {order.hasBag ? (
          <span className="rounded-md bg-brand-soft px-2 py-0.5 uppercase tracking-wide">
            {t('orders.hasBag')}
          </span>
        ) : null}
        {order.passengerGender !== 'any' ? (
          <span className="rounded-md bg-brand-soft px-2 py-0.5 uppercase tracking-wide">
            {formatPassengerGender(order.passengerGender, t)}
          </span>
        ) : null}
      </div>

      {order.comment ? (
        <div className="mt-3 border-l-2 border-brand-blue/30 pl-3">
          <p className="text-xs italic text-brand-muted leading-relaxed">
            "{order.comment}"
          </p>
        </div>
      ) : null}

      {order.status === 'matched' && order.driver ? (
        <div className="mt-3 rounded-[22px] border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
          <div className="text-xs font-black uppercase tracking-wider text-emerald-700">
            {`🚗 ${t('orders.driverFound')}`}
          </div>
          <div className="mt-2 space-y-1 text-xs font-semibold text-emerald-900">
            <div>
              {t('orders.driverName')}: {order.driver.name}
            </div>
            {order.driver.phone ? (
              <div>
                {t('orders.driverPhone')}: {order.driver.phone}
              </div>
            ) : null}
            {order.driver.carModel ? (
              <div>
                {t('orders.driverCar')}: {order.driver.carModel}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t border-brand-line pt-3">
        <div className="text-[10px] font-medium text-brand-muted/70">
          ID: {formatDisplayId(order.id)}
        </div>
        <div className="text-[10px] font-medium text-brand-muted/70">
          {createdAtDate}
        </div>
      </div>
    </article>
  )
}
