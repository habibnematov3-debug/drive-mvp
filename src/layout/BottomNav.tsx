import { navItems } from '../data/navigation'
import type { TabKey } from '../types/drivee'

type BottomNavProps = {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

function HomeIcon({ active }: { active: boolean }) {
  const color = active ? '#2F97D4' : '#94A3B8'

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 20v-9.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 21.5v-7.1c0-.6.5-1.1 1.1-1.1h3.4c.6 0 1.1.5 1.1 1.1v7.1"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function OrdersIcon({ active }: { active: boolean }) {
  const color = active ? '#2F97D4' : '#94A3B8'

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 7h14v14H7V7Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M17 7V5.5A1.5 1.5 0 0 0 15.5 4H4.5A1.5 1.5 0 0 0 3 5.5V16.5A1.5 1.5 0 0 0 4.5 18H7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  const color = active ? '#2F97D4' : '#94A3B8'

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12Z"
        stroke={color}
        strokeWidth="1.8"
      />
      <path
        d="M4.5 20.5a8.5 8.5 0 0 1 15 0"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabButtonClass = (active: boolean) =>
    [
      'flex flex-1 flex-col items-center justify-center gap-1 rounded-[18px] py-2 transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
      active
        ? 'border border-brand-ink bg-white text-brand-blue shadow-[0_10px_24px_rgba(24,38,59,0.08)]'
        : 'border border-transparent text-slate-400',
    ].join(' ')

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 mx-auto w-full max-w-[var(--app-shell-width)] rounded-t-[28px] border border-brand-line bg-white/95 px-2 pt-2 shadow-soft backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex gap-1">
        {navItems.map(({ tab, label }) => {
          const active = activeTab === tab
          const Icon =
            tab === 'home' ? HomeIcon : tab === 'orders' ? OrdersIcon : ProfileIcon

          return (
            <button
              key={tab}
              type="button"
              className={tabButtonClass(active)}
              onClick={() => onTabChange(tab)}
              aria-current={active ? 'page' : undefined}
            >
              <Icon active={active} />
              <span
                className={
                  active
                    ? 'text-brand-blue text-xs font-medium'
                    : 'text-slate-400 text-xs font-medium'
                }
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
