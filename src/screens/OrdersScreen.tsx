import { useMemo, useState } from 'react'
import OrderCard from '../components/OrderCard'
import { useLanguage } from '../contexts/LanguageContext'
import type { RequestStatus, RideRequest } from '../types/drivee'
import { formatRequestStatus } from '../utils/format'

type OrdersScreenProps = {
  orders: RideRequest[]
  isLoading?: boolean
}

type StatusFilter = 'all' | RequestStatus

export default function OrdersScreen({ orders, isLoading = false }: OrdersScreenProps) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const stats = useMemo(() => {
    const matched = orders.filter((order) => order.status === 'matched').length
    const open = orders.filter((order) => order.status === 'submitted').length
    return { total: orders.length, matched, open }
  }, [orders])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return orders.filter((order) => {
      const byStatus = statusFilter === 'all' || order.status === statusFilter
      if (!byStatus) return false

      if (!q) return true

      const routeText =
        order.routeId === 'kokand-tashkent'
          ? t('routes.kokandTashkent')
          : t('routes.tashkentKokand')

      return (
        order.id.toLowerCase().includes(q) ||
        order.routeLabel.toLowerCase().includes(q) ||
        routeText.toLowerCase().includes(q) ||
        formatRequestStatus(order.status, t).toLowerCase().includes(q)
      )
    })
  }, [orders, query, statusFilter, t])

  const filters: Array<{ key: StatusFilter; label: string }> = [
    { key: 'all', label: t('orders.filterAll') },
    { key: 'submitted', label: t('orders.filterSubmitted') },
    { key: 'matched', label: t('orders.filterMatched') },
    { key: 'cancelled', label: t('orders.filterCancelled') },
  ]

  return (
    <div className="screen-enter pb-2 pt-1">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[18px] border border-brand-line bg-white px-3 py-3 text-center shadow-soft">
          <div className="text-xs text-brand-muted">{t('orders.statTotal')}</div>
          <div className="mt-1 text-lg font-bold text-brand-ink">{stats.total}</div>
        </div>
        <div className="rounded-[18px] border border-brand-line bg-white px-3 py-3 text-center shadow-soft">
          <div className="text-xs text-brand-muted">{t('orders.statOpen')}</div>
          <div className="mt-1 text-lg font-bold text-brand-ink">{stats.open}</div>
        </div>
        <div className="rounded-[18px] border border-brand-line bg-white px-3 py-3 text-center shadow-soft">
          <div className="text-xs text-brand-muted">{t('orders.statMatched')}</div>
          <div className="mt-1 text-lg font-bold text-brand-ink">{stats.matched}</div>
        </div>
      </div>

      <div className="mt-3 rounded-[28px] border border-brand-line bg-white p-4 shadow-soft">
        <div className="mb-2 text-sm font-semibold text-brand-ink">{t('orders.title')}</div>
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
            placeholder={t('orders.search')}
            className="flex-1 rounded-[18px] border border-brand-line bg-white px-3 py-3 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active = statusFilter === filter.key
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={
                  active
                    ? 'rounded-full border border-brand-blue bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white'
                    : 'rounded-full border border-brand-line bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink hover:bg-brand-soft/40'
                }
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[28px] border border-brand-line bg-white shadow-soft">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((key) => (
              <div key={key} className="animate-pulse rounded-[20px] bg-brand-soft p-3">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-40 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-32 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((order, idx) => (
            <div key={order.id} className={idx === 0 ? '' : 'border-t border-brand-line'}>
              <OrderCard order={order} />
            </div>
          ))
        ) : (
          <div className="px-5 py-8 text-center">
            <div className="text-sm font-semibold text-brand-ink">{t('orders.emptyTitle')}</div>
            <p className="mt-2 text-sm text-brand-muted">{t('orders.emptyHint')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
