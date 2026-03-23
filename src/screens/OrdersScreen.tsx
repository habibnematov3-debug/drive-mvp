import { useMemo, useState } from 'react'
import OrderCard from '../components/OrderCard'
import type { RideRequest } from '../types/drivee'
import { formatRequestStatus } from '../utils/format'

type OrdersScreenProps = {
  orders: RideRequest[]
}

export default function OrdersScreen({ orders }: OrdersScreenProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orders

    return orders.filter((order) => {
      return (
        order.id.toLowerCase().includes(q) ||
        order.routeLabel.toLowerCase().includes(q) ||
        formatRequestStatus(order.status).toLowerCase().includes(q)
      )
    })
  }, [orders, query])

  return (
    <div className="pb-2 pt-1">
      <div className="rounded-[28px] border border-brand-line bg-white p-4 shadow-soft">
        <div className="mb-2 text-sm font-semibold text-brand-ink">Arizalar</div>
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="text-brand-muted"
          >
            <path
              d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M16.2 16.2 21 21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ariza, yo'nalish yoki holat"
            className="flex-1 rounded-[18px] border border-brand-line bg-white px-3 py-3 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[28px] border border-brand-line bg-white shadow-soft">
        {filtered.map((order, idx) => (
          <div
            key={order.id}
            className={idx === 0 ? '' : 'border-t border-brand-line'}
          >
            <OrderCard order={order} />
          </div>
        ))}

        {filtered.length === 0 ? (
          <div className="bg-white p-4 text-sm text-brand-muted">
            So'rovingiz bo'yicha arizalar topilmadi.
          </div>
        ) : null}
      </div>
    </div>
  )
}
