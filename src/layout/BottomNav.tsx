import { ClipboardList, Home, Star, UserRound } from 'lucide-react'
import type { TabKey } from '../types/drivee'
import { cn } from '../lib/utils'

type BottomNavProps = {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

const items: Array<{ tab: TabKey; label: string; Icon: typeof Home }> = [
  { tab: 'home', label: 'Bosh sahifa', Icon: Home },
  { tab: 'requests', label: 'Arizalar', Icon: ClipboardList },
  { tab: 'rating', label: 'Baholash', Icon: Star },
  { tab: 'profile', label: 'Profil', Icon: UserRound },
]

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[var(--app-shell-width)] border-t border-brand-line bg-white/95 px-2 pt-2 shadow-soft backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-4 gap-1">
        {items.map(({ tab, label, Icon }) => {
          const active = activeTab === tab

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-black transition',
                active ? 'bg-brand-blue/10 text-brand-blue' : 'text-slate-400',
              )}
            >
              <Icon className={cn('h-5 w-5', active && tab === 'rating' ? 'fill-brand-blue' : '')} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
