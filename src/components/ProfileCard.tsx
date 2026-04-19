import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from './LanguageSelector'
import type { Passenger } from '../types/drivee'
import { MessageCircle, LogOut, ChevronRight, MapPin } from 'lucide-react'

type ProfileCardProps = {
  passenger: Passenger
  onLogout: () => void
  onSupport: () => void
}

export default function ProfileCard({
  passenger,
  onLogout,
  onSupport,
}: ProfileCardProps) {
  const { t } = useLanguage()
  const initial = passenger.name.trim().slice(0, 1).toUpperCase() || 'D'

  return (
    <div className="space-y-4 px-1 pb-10">
      {/* Main User Card */}
      <section className="relative overflow-hidden rounded-[32px] border border-brand-line bg-white p-6 shadow-soft">
        <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-brand-blue/5" />
        
        <div className="flex items-center gap-4">
          <div className="relative">
            {passenger.avatarUrl ? (
              <img
                src={passenger.avatarUrl}
                alt={passenger.name}
                className="h-20 w-20 rounded-[30px] object-cover ring-4 ring-brand-blue/10 shadow-lg"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-[30px] bg-brand-blue-soft font-black text-2xl text-brand-blue shadow-lg ring-4 ring-brand-blue/10">
                {initial}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 border-4 border-white">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black text-brand-ink leading-tight">
              {passenger.name}
            </h2>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-brand-muted">
              <MapPin className="h-3.5 w-3.5 text-brand-blue" />
              {passenger.secondaryLine || 'Member'}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[22px] bg-brand-soft/80 p-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">ID</div>
            <div className="mt-0.5 text-xs font-black text-brand-ink">
              {passenger.telegramUserId?.slice(0, 8) || 'USR-482'}
            </div>
          </div>
          <div className="rounded-[22px] bg-brand-soft/80 p-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Points</div>
            <div className="mt-0.5 text-xs font-black text-emerald-600">+120</div>
          </div>
        </div>
      </section>

      {/* Settings Sections */}
      <div className="space-y-3">
        <div className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted/70">
          Preferences
        </div>
        
        <section className="rounded-[32px] border border-brand-line bg-white p-4 shadow-soft">
          <LanguageSelector />
        </section>

        <div className="px-5 pt-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted/70">
          Account
        </div>

        <a
          href="https://t.me/gmkhn"
          target="_blank"
          rel="noopener noreferrer"
          className="group block w-full rounded-[28px] border border-brand-line bg-white p-4 text-left shadow-soft transition-all hover:border-brand-blue/50 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-brand-blue/10 text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-black text-brand-ink">
                  {t('profile.contactSupport') || 'Contact Support'}
                </div>
                <div className="text-xs font-bold text-brand-muted">
                  @gmkhn
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-brand-muted group-hover:text-brand-blue" />
          </div>
        </a>

        <button
          type="button"
          onClick={onLogout}
          className="group w-full rounded-[28px] border border-red-500/10 bg-red-500/[0.03] p-4 text-left transition-all hover:bg-red-500/[0.08] active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-red-500/10 text-red-500 transition-colors group-hover:bg-red-500 group-hover:text-white">
                <LogOut className="h-6 w-6" />
              </div>
              <div className="text-sm font-black text-red-700">
                {t('profile.logout')}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-red-300 group-hover:text-red-500" />
          </div>
        </button>
      </div>

      <div className="pt-4 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted/40">
          Drivee v1.0.4
        </div>
      </div>
    </div>
  )
}
