import { useMemo, useState } from 'react'
import OrderCard from '../components/OrderCard'
import { useLanguage } from '../contexts/LanguageContext'
import type { RequestStatus, RideRequest } from '../types/drivee'
import { formatRequestStatus } from '../utils/format'
import { Search, ClipboardList } from 'lucide-react'
import { cn } from '../lib/utils'

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

      return (
        order.id.toLowerCase().includes(q) ||
        order.routeId.toLowerCase().includes(q) ||
        order.routeLabel.toLowerCase().includes(q) ||
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
    <div className="flex flex-col h-full screen-enter pb-2">
      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-2 px-1">
        <div className="rounded-[24px] border border-brand-line bg-white px-3 py-4 text-center shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('orders.statTotal')}</div>
          <div className="mt-1 text-2xl font-black text-brand-ink">{stats.total}</div>
        </div>
        <div className="rounded-[24px] border border-brand-line bg-white px-3 py-4 text-center shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">{t('orders.statMatched')}</div>
          <div className="mt-1 text-2xl font-black text-emerald-600">{stats.matched}</div>
        </div>
        <div className="rounded-[24px] border border-brand-line bg-white px-3 py-4 text-center shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-blue">{t('orders.statOpen')}</div>
          <div className="mt-1 text-2xl font-black text-brand-blue">{stats.open}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mt-4 px-1">
        <div className="rounded-[32px] border border-brand-line bg-white p-4 shadow-soft">
          <div className="relative flex items-center mb-3">
            <Search className="absolute left-4 h-5 w-5 text-brand-muted pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('orders.search')}
              className="w-full rounded-[22px] border border-brand-line bg-brand-soft/30 px-11 py-3 text-sm font-semibold text-brand-ink outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
            />
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {filters.map((filter) => {
              const active = statusFilter === filter.key
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStatusFilter(filter.key)}
                  className={cn(
                    "flex-shrink-0 rounded-[18px] border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all active:scale-95",
                    active
                      ? "border-brand-blue bg-brand-blue text-white shadow-soft shadow-brand-blue/20"
                      : "border-brand-line bg-white text-brand-ink hover:bg-brand-soft/50"
                  )}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="mt-4 flex-1">
        {isLoading ? (
          <div className="space-y-4 px-1">
            {[1, 2, 3].map((key) => (
              <div key={key} className="animate-pulse rounded-[32px] border border-brand-line bg-white p-5 shadow-soft">
                <div className="flex justify-between items-start">
                  <div className="h-5 w-32 rounded bg-slate-100" />
                  <div className="h-6 w-16 rounded-full bg-slate-100" />
                </div>
                <div className="mt-4 flex gap-3">
                  <div className="h-4 w-24 rounded bg-slate-100" />
                  <div className="h-4 w-20 rounded bg-slate-100" />
                </div>
                <div className="mt-4 h-12 w-full rounded-[20px] bg-slate-50" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3 pb-8">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="flex h-[40vh] flex-col items-center justify-center px-10 text-center animate-fade-in shadow-soft bg-white border border-brand-line rounded-[32px] m-1">
            <div className="relative mb-6">
              <div className="absolute -inset-4 rounded-full bg-brand-blue/5 animate-pulse" />
              <div className="relative h-20 w-20 rounded-[28px] bg-brand-blue/10 flex items-center justify-center">
                <ClipboardList className="h-10 w-10 text-brand-blue" />
              </div>
            </div>
            <h3 className="text-xl font-black text-brand-ink">{t('orders.emptyTitle')}</h3>
            <p className="mt-2 text-sm font-medium text-brand-muted leading-relaxed">
              {t('orders.emptyHint')}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 text-sm font-bold text-brand-blue uppercase tracking-widest hover:underline"
            >
              {t('common.refresh') || 'Refresh'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
