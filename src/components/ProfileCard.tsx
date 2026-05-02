import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from './LanguageSelector'
import type { Passenger } from '../types/drivee'
import { MessageCircle, LogOut, ChevronRight, MapPin, Languages } from 'lucide-react'

type ProfileCardProps = {
  passenger: Passenger
  onLogout: () => void
  onSupport: () => void
}

function formatProfileId(telegramUserId?: string) {
  const normalized = String(telegramUserId || '').trim()
  if (!normalized) return 'DRV-001'
  return `DRV-${normalized.slice(-4)}`
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
              {passenger.secondaryLine || passenger.languageLabel || 'Telegram'}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[22px] bg-brand-soft/80 p-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
              {t('profile.userId')}
            </div>
            <div className="mt-0.5 text-xs font-black text-brand-ink">
              {formatProfileId(passenger.telegramUserId)}
            </div>
          </div>
          <div className="rounded-[22px] bg-brand-soft/80 p-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
              {t('profile.language')}
            </div>
            <div className="mt-0.5 flex items-center justify-center gap-1 text-xs font-black text-brand-ink">
              <Languages className="h-3.5 w-3.5 text-brand-blue" />
              {passenger.languageLabel || t('profile.languageValue')}
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <div className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted/70">
          {t('profile.preferences')}
        </div>

        <section className="rounded-[32px] border border-brand-line bg-white p-4 shadow-soft">
          <LanguageSelector />
        </section>

        <div className="px-5 pt-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted/70">
          {t('profile.account')}
        </div>

        <button
          type="button"
          onClick={onSupport}
          className="group block w-full rounded-[28px] border border-brand-line bg-white p-4 text-left shadow-soft transition-all hover:border-brand-blue/50 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-brand-blue/10 text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-black text-brand-ink">
                  {t('profile.contactSupport')}
                </div>
                <div className="text-xs font-bold text-brand-muted">@drivee_inc</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-brand-muted group-hover:text-brand-blue" />
          </div>
        </button>

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
