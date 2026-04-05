import { useLanguage } from '../contexts/LanguageContext'
import type { RequestStatus, RideRequest } from '../types/drivee'
import {
  formatDateUz,
  formatPassengerGender,
  formatPassengerCount,
} from '../utils/format'

type OrderCardProps = {
  order: RideRequest
}

function StatusBadge({ status, t }: { status: RequestStatus; t: (key: string) => string }) {
  const statusText = status === 'submitted' ? t('status.submitted') : status === 'matched' ? t('status.matched') : t('status.cancelled')

  if (status === 'submitted') {
    return (
      <span className="inline-flex items-center rounded-full bg-brand-blue-soft px-2.5 py-1 text-xs font-bold text-brand-blue">
        {statusText}
      </span>
    )
  }

  if (status === 'matched') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-600">
        {statusText}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600">
      {statusText}
    </span>
  )
}

export default function OrderCard({ order }: OrderCardProps) {
  const { t } = useLanguage()
  return (
    <article className="bg-transparent px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={order.status} t={t} />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <div className="text-base font-extrabold text-brand-ink">
          {order.routeLabel}
        </div>

        <div className="text-sm text-brand-muted">
          {formatDateUz(order.dateISO)} • {order.time}
        </div>

        {order.passengerPhone ? (
          <div className="text-sm text-brand-ink">
            <span className="text-xs font-semibold text-brand-muted">{t('orders.phone')}: </span>
            <span className="font-semibold">{order.passengerPhone}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 text-xs font-semibold text-brand-muted">
          <span className="rounded-full bg-brand-soft px-2.5 py-1">
            {formatPassengerCount(order.passengerCount, t)}
          </span>
          {order.fullCar ? (
            <span className="rounded-full bg-brand-soft px-2.5 py-1">
              {t('orders.fullCar')}
            </span>
          ) : null}
          {order.hasBag ? (
            <span className="rounded-full bg-brand-soft px-2.5 py-1">
              {t('orders.hasBag')}
            </span>
          ) : null}
          {order.passengerGender !== 'any' ? (
            <span className="rounded-full bg-brand-soft px-2.5 py-1">
              {formatPassengerGender(order.passengerGender, t)}
            </span>
          ) : null}
        </div>

        {order.comment ? (
          <div className="rounded-[20px] bg-brand-soft px-3 py-2 text-sm text-brand-ink">
            {order.comment}
          </div>
        ) : null}

        <div className="pt-1 text-xs text-brand-muted">
          {t('orders.bookingId')}: <span className="font-semibold text-brand-ink">{order.id}</span>
        </div>
      </div>
    </article>
  )
}
