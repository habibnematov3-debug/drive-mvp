import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from './LanguageSelector'
import type { Passenger } from '../types/drivee'

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
    <section className="space-y-3 rounded-[28px] border border-brand-line bg-white p-4 shadow-soft">
      <div className="flex items-center gap-3">
        {passenger.avatarUrl ? (
          <img
            src={passenger.avatarUrl}
            alt={passenger.name}
            className="h-14 w-14 rounded-[24px] object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-brand-blue-soft font-semibold text-brand-blue">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-base font-semibold text-brand-ink">
            {passenger.name}
          </div>
          <div className="mt-1 text-sm text-brand-muted">
            {passenger.secondaryLine}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-brand-line bg-brand-soft/50 px-4 py-3">
        <div className="text-xs text-brand-muted">Telegram</div>
        <div className="mt-1 text-sm font-semibold text-brand-ink">
          {passenger.languageLabel || "O'zbekcha"}
        </div>
      </div>

      <LanguageSelector />

      <button
        type="button"
        onClick={onSupport}
        className="w-full rounded-[24px] border border-brand-line bg-white transition hover:bg-brand-soft/40 focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-xs text-brand-muted">{t('profile.support')}</div>
            <div className="text-sm font-semibold text-brand-ink">
              {t('profile.sendQuestion')}
            </div>
          </div>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="text-brand-muted"
          >
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="w-full rounded-[24px] border border-red-500/20 bg-red-500/5 py-3 font-semibold text-red-700 transition hover:bg-red-500/10 focus:outline-none focus:ring-4 focus:ring-red-500/10"
      >
        {t('profile.logout')}
      </button>
    </section>
  )
}
