import { useLanguage } from '../contexts/LanguageContext'

type AuthScreenProps = {
  authState: 'loading' | 'ready' | 'telegram_required' | 'error'
  errorMessage?: string | null
  onOpenTelegram?: () => void
  canOpenTelegram: boolean
  onRetry?: () => void
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 5 6v5c0 5 3.4 8 7 10 3.6-2 7-5 7-10V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9.3 12.2 1.9 1.9 3.5-3.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function AuthScreen({
  authState,
  errorMessage,
  onOpenTelegram,
  canOpenTelegram,
  onRetry,
}: AuthScreenProps) {
  const { t } = useLanguage()
  const isLoading = authState === 'loading'
  const shouldShowTelegramButton = authState === 'telegram_required' && canOpenTelegram
  const shouldShowRetryButton = authState === 'error' && Boolean(onRetry)
  const messageText = isLoading
    ? t('auth.checkingProfile')
    : authState === 'telegram_required'
      ? t('auth.needTelegramApp')
      : errorMessage || t('auth.needTelegramApp')

  return (
    <div className="screen-enter pb-4 pt-1">
      <section className="rounded-[32px] border border-brand-line bg-white px-5 py-8 shadow-soft">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue-soft px-3 py-1 text-xs font-semibold text-brand-blue">
          <ShieldIcon />
          Telegram Auth
        </div>

        <h2 className="mt-4 text-[1.5rem] font-bold leading-tight text-brand-ink">
          {t('auth.telegramLogin')}
        </h2>
        <p className="mt-3 text-sm leading-6 text-brand-muted">
          {messageText}
        </p>

        {shouldShowTelegramButton ? (
          <button
            type="button"
            onClick={onOpenTelegram}
            className="mt-6 w-full rounded-[24px] bg-brand-blue py-4 text-base font-semibold text-white transition hover:brightness-[1.02] focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
          >
            {t('auth.openInTelegram')}
          </button>
        ) : null}

        {shouldShowRetryButton ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 w-full rounded-[24px] border border-brand-line bg-white py-4 text-base font-semibold text-brand-ink transition hover:bg-brand-soft/30 focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
          >
            {t('auth.retry')}
          </button>
        ) : null}
      </section>
    </div>
  )
}
