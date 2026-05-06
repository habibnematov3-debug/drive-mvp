import { useMemo, useState } from 'react'
import OrderCard from '../components/OrderCard'
import { useLanguage } from '../contexts/LanguageContext'
import type { RequestStatus, RideRequest } from '../types/drivee'
import { Search, ClipboardList, RefreshCw } from 'lucide-react'
import { cn } from '../lib/utils'
import { useOrderPolling } from '../hooks/useOrderPolling'
import { getTelegramUser } from '../utils/telegram'

type OrdersScreenProps = {
  orders?: RideRequest[]
  isLoading?: boolean
  isRefreshing?: boolean
  onCancelOrder?: (
    orderId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  onRefreshOrders?: () => Promise<unknown> | unknown
}

type StatusFilter = 'all' | RequestStatus
type VisualBookingState =
  | 'yangi'
  | 'kutilmoqda'
  | 'jarayonda'
  | 'tugallandi'
  | 'bekor_qilindi'

function getVisualBookingState(order: RideRequest): VisualBookingState {
  const normalizedStatus = String(order.status || '').trim().toLowerCase()

  if (normalizedStatus.includes('bekor') || normalizedStatus === 'cancelled') {
    return 'bekor_qilindi'
  }

  if (normalizedStatus.includes('tugallandi') || normalizedStatus === 'completed') {
    return 'tugallandi'
  }

  if (normalizedStatus.includes('jarayonda') || normalizedStatus === 'matched') {
    return 'jarayonda'
  }

  if (order.driver?.name) {
    return 'kutilmoqda'
  }

  return 'yangi'
}

function getVisualBookingMeta(state: VisualBookingState) {
  switch (state) {
    case 'yangi':
      return {
        label: 'Yangi',
        dotClassName: 'bg-amber-400',
        toneClassName: 'border-amber-200 bg-amber-50 text-amber-700',
      }
    case 'kutilmoqda':
      return {
        label: 'Haydovchi kutilmoqda',
        dotClassName: 'bg-sky-500',
        toneClassName: 'border-sky-200 bg-sky-50 text-sky-700',
      }
    case 'jarayonda':
      return {
        label: 'Haydovchi topildi 🚗',
        dotClassName: 'bg-emerald-500',
        toneClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      }
    case 'tugallandi':
      return {
        label: 'Tugallandi ✅',
        dotClassName: 'bg-slate-400',
        toneClassName: 'border-slate-200 bg-slate-100 text-slate-600',
      }
    case 'bekor_qilindi':
      return {
        label: 'Bekor qilindi ❌',
        dotClassName: 'bg-red-500',
        toneClassName: 'border-red-200 bg-red-50 text-red-600',
      }
  }
}

export default function OrdersScreen({
  orders: propsOrders,
  isLoading = false,
  isRefreshing: propsRefreshing = false,
  onCancelOrder,
  onRefreshOrders,
}: OrdersScreenProps) {
  const { t } = useLanguage()
  const telegramUser = getTelegramUser()

  // Use hook for polling if orders not provided by parent
  const {
    orders: hookOrders,
    isRefreshing: hookRefreshing,
    refresh: hookRefresh,
  } = useOrderPolling({
    enabled: !propsOrders || propsOrders.length === 0,
    pollIntervalMs: 10_000,
    telegramUserId: telegramUser?.id?.toString(),
  })

  // Prefer parent-provided orders, fall back to hook orders
  const orders = propsOrders ?? hookOrders
  const isRefreshing = propsRefreshing || hookRefreshing

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [bookingToCancel, setBookingToCancel] = useState<RideRequest | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const stats = useMemo(() => {
    const matched = orders.filter(
      (order) => getVisualBookingState(order) === 'jarayonda',
    ).length
    const open = orders.filter((order) => {
      const state = getVisualBookingState(order)
      return state === 'yangi' || state === 'kutilmoqda'
    }).length

    return { total: orders.length, matched, open }
  }, [orders])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return orders.filter((order) => {
      const visualState = getVisualBookingState(order)
      const visualLabel = getVisualBookingMeta(visualState).label.toLowerCase()
      const byStatus =
        statusFilter === 'all' ||
        (statusFilter === 'submitted' &&
          (visualState === 'yangi' || visualState === 'kutilmoqda')) ||
        (statusFilter === 'matched' && visualState === 'jarayonda') ||
        (statusFilter === 'cancelled' && visualState === 'bekor_qilindi')

      if (!byStatus) return false
      if (!q) return true

      return (
        order.id.toLowerCase().includes(q) ||
        order.routeId.toLowerCase().includes(q) ||
        order.routeLabel.toLowerCase().includes(q) ||
        visualLabel.includes(q)
      )
    })
  }, [orders, query, statusFilter])

  const filters: Array<{ key: StatusFilter; label: string }> = [
    { key: 'all', label: t('orders.filterAll') },
    { key: 'submitted', label: t('orders.filterSubmitted') },
    { key: 'matched', label: t('orders.filterMatched') },
    { key: 'cancelled', label: t('orders.filterCancelled') },
  ]

  const canCancelOrder = (order: RideRequest) =>
    typeof onCancelOrder === 'function' &&
    ['yangi', 'kutilmoqda'].includes(getVisualBookingState(order))

  function openCancelDialog(order: RideRequest) {
    setCancelError(null)
    setBookingToCancel(order)
  }

  function closeCancelDialog() {
    if (isCancelling) return
    setCancelError(null)
    setBookingToCancel(null)
  }

  async function handleManualRefresh() {
    if (onRefreshOrders && typeof onRefreshOrders === 'function') {
      await onRefreshOrders()
    } else {
      await hookRefresh({ manual: true, showIndicator: true })
    }
  }

  async function handleConfirmCancellation() {
    if (!bookingToCancel || !onCancelOrder) {
      return
    }

    setIsCancelling(true)
    setCancelError(null)

    const result = await onCancelOrder(bookingToCancel.id)

    if (!result.ok) {
      setCancelError(result.error || "Arizani bekor qilib bo'lmadi")
      setIsCancelling(false)
      return
    }

    setIsCancelling(false)
    setBookingToCancel(null)

    // Trigger refresh to get latest data
    if (onRefreshOrders && typeof onRefreshOrders === 'function') {
      await onRefreshOrders()
    } else {
      await hookRefresh({ manual: false, showIndicator: false })
    }
  }

  return (
    <div className="flex flex-col h-full screen-enter pb-2">
      <div className="grid grid-cols-3 gap-2 px-1">
        <div className="rounded-[24px] border border-brand-line bg-white px-3 py-4 text-center shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
            {t('orders.statTotal')}
          </div>
          <div className="mt-1 text-2xl font-black text-brand-ink">{stats.total}</div>
        </div>
        <div className="rounded-[24px] border border-brand-line bg-white px-3 py-4 text-center shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
            {t('orders.statMatched')}
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-600">{stats.matched}</div>
        </div>
        <div className="rounded-[24px] border border-brand-line bg-white px-3 py-4 text-center shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-blue">
            {t('orders.statOpen')}
          </div>
          <div className="mt-1 text-2xl font-black text-brand-blue">{stats.open}</div>
        </div>
      </div>

      <div className="mt-4 px-1">
        <div className="rounded-[32px] border border-brand-line bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-muted">
              Arizalar
            </div>

            <button
              type="button"
              onClick={() => {
                void handleManualRefresh()
              }}
              aria-label="Arizalarni yangilash"
              title="Arizalarni yangilash"
              disabled={isRefreshing}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-[16px] border transition',
                isRefreshing
                  ? 'cursor-not-allowed border-brand-line bg-brand-soft/40 text-brand-muted'
                  : 'border-brand-blue/20 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue hover:text-white',
              )}
            >
              <RefreshCw
                className={cn('h-4 w-4', isRefreshing ? 'animate-spin' : '')}
              />
            </button>
          </div>

          <div className="relative mb-3 flex items-center">
            <Search className="pointer-events-none absolute left-4 h-5 w-5 text-brand-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
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
                    'flex-shrink-0 rounded-[18px] border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all active:scale-95',
                    active
                      ? 'border-brand-blue bg-brand-blue text-white shadow-soft shadow-brand-blue/20'
                      : 'border-brand-line bg-white text-brand-ink hover:bg-brand-soft/50',
                  )}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1">
        {isLoading && orders.length === 0 ? (
          <div className="space-y-4 px-1">
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="animate-pulse rounded-[32px] border border-brand-line bg-white p-5 shadow-soft"
              >
                <div className="flex items-start justify-between">
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
          <div className="space-y-0 pb-8">
            {filtered.map((order) => {
              const visualState = getVisualBookingState(order)
              const visualMeta = getVisualBookingMeta(visualState)
              const displayOrder = {
                ...order,
                driver: undefined,
              }

              return (
                <div key={order.id}>
                  <OrderCard order={displayOrder} />

                  <div className="-mt-px mx-3 rounded-b-[28px] border border-t-0 border-brand-line bg-white px-4 pb-4 pt-3 shadow-soft">
                    <div
                      className={cn(
                        'flex items-center gap-2 rounded-[18px] border px-3 py-2 text-xs font-black',
                        visualMeta.toneClassName,
                      )}
                    >
                      <span
                        className={cn('h-2.5 w-2.5 rounded-full', visualMeta.dotClassName)}
                      />
                      <span>{visualMeta.label}</span>
                    </div>

                    {visualState === 'jarayonda' && order.driver?.name ? (
                      <div className="mt-3 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                        <div>🚗 Haydovchi: {order.driver.name}</div>
                        {order.driver.phone ? (
                          <div className="mt-1">📞 Tel: {order.driver.phone}</div>
                        ) : null}
                        {order.driver.carModel ? (
                          <div className="mt-1">🚙 Mashina: {order.driver.carModel}</div>
                        ) : null}
                      </div>
                    ) : null}

                    {canCancelOrder(order) ? (
                      <button
                        type="button"
                        onClick={() => openCancelDialog(order)}
                        className="mt-3 w-full rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-600 hover:text-white active:scale-[0.99]"
                      >
                        ❌ Bekor qilish
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="m-1 flex h-[40vh] flex-col items-center justify-center rounded-[32px] border border-brand-line bg-white px-10 text-center shadow-soft animate-fade-in">
            <div className="relative mb-6">
              <div className="absolute -inset-4 rounded-full bg-brand-blue/5 animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] bg-brand-blue/10">
                <ClipboardList className="h-10 w-10 text-brand-blue" />
              </div>
            </div>
            <h3 className="text-xl font-black text-brand-ink">{t('orders.emptyTitle')}</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-brand-muted">
              {t('orders.emptyHint')}
            </p>
            <button
              onClick={() => {
                void handleManualRefresh()
              }}
              className="mt-6 text-sm font-bold uppercase tracking-widest text-brand-blue hover:underline"
            >
              Yangilash
            </button>
          </div>
        )}
      </div>

      {bookingToCancel ? (
        <div className="fixed inset-0 z-50 flex items-end bg-brand-ink/45 px-4 pb-6 pt-12">
          <div
            className="mx-auto w-full max-w-md rounded-[32px] border border-brand-line bg-white p-5 shadow-soft"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
            aria-describedby="cancel-booking-description"
          >
            <div id="cancel-booking-title" className="text-lg font-black text-brand-ink">
              Arizani bekor qilmoqchimisiz?
            </div>
            <p
              id="cancel-booking-description"
              className="mt-2 text-sm font-medium leading-relaxed text-brand-muted"
            >
              Bekor qilsangiz, bu ariza endi haydovchilarga ko&apos;rsatilmaydi.
            </p>

            {cancelError ? (
              <div className="mt-4 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {cancelError}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeCancelDialog}
                disabled={isCancelling}
                className="rounded-[18px] border border-brand-line px-4 py-3 text-sm font-black text-brand-ink transition hover:bg-brand-soft/40 disabled:cursor-not-allowed disabled:text-brand-muted"
              >
                Yo&apos;q
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleConfirmCancellation()
                }}
                disabled={isCancelling}
                className="rounded-[18px] bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isCancelling ? 'Bekor qilinmoqda...' : 'Ha, bekor qilish'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
