import type { RequestStatus, RideRequest } from '../types/drivee'
import {
  formatDateUz,
  formatPassengerGender,
  formatPassengerCount,
  formatRequestStatus,
} from '../utils/format'

type OrderCardProps = {
  order: RideRequest
}

function StatusBadge({ status }: { status: RequestStatus }) {
  if (status === 'submitted') {
    return (
      <span className="inline-flex items-center rounded-full bg-brand-blue-soft px-2.5 py-1 text-xs font-bold text-brand-blue">
        {formatRequestStatus(status)}
      </span>
    )
  }

  if (status === 'matched') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-600">
        {formatRequestStatus(status)}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600">
      {formatRequestStatus(status)}
    </span>
  )
}

export default function OrderCard({ order }: OrderCardProps) {
  return (
    <article className="bg-transparent px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <div className="text-base font-extrabold text-brand-ink">
          {order.routeLabel}
        </div>

        <div className="text-sm text-brand-muted">
          {formatDateUz(order.dateISO)} • {order.time}
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold text-brand-muted">
          <span className="rounded-full bg-brand-soft px-2.5 py-1">
            {formatPassengerCount(order.passengerCount)}
          </span>
          {order.fullCar ? (
            <span className="rounded-full bg-brand-soft px-2.5 py-1">
              To'liq mashina
            </span>
          ) : null}
          {order.passengerGender !== 'any' ? (
            <span className="rounded-full bg-brand-soft px-2.5 py-1">
              {formatPassengerGender(order.passengerGender)}
            </span>
          ) : null}
        </div>

        {order.comment ? (
          <div className="rounded-[20px] bg-brand-soft px-3 py-2 text-sm text-brand-ink">
            {order.comment}
          </div>
        ) : null}

        <div className="pt-1 text-xs text-brand-muted">
          Ariza: <span className="font-semibold text-brand-ink">{order.id}</span>
        </div>
      </div>
    </article>
  )
}
