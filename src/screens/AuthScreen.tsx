type AuthScreenProps = {
  authState: 'loading' | 'ready' | 'telegram_required' | 'error'
  errorMessage?: string | null
  onOpenTelegram?: () => void
  canOpenTelegram: boolean
  onRetry?: () => void
}

export default function AuthScreen({
  authState,
  errorMessage,
  onOpenTelegram,
  canOpenTelegram,
  onRetry,
}: AuthScreenProps) {
  const isLoading = authState === 'loading'
  const shouldShowTelegramButton =
    authState === 'telegram_required' && canOpenTelegram
  const shouldShowRetryButton = authState === 'error' && Boolean(onRetry)

  return (
    <div className="pb-4 pt-1">
      <section className="rounded-[32px] border border-brand-line bg-white px-5 py-8 shadow-soft">
        <h2 className="text-[1.5rem] font-bold leading-tight text-brand-ink">
          Telegram orqali kirish
        </h2>
        <p className="mt-3 text-sm leading-6 text-brand-muted">
          {isLoading
            ? 'Profil tekshirilmoqda...'
            : errorMessage ||
              'Ilovadan foydalanish uchun uni Telegram Mini App ichidan oching.'}
        </p>

        {shouldShowTelegramButton ? (
          <button
            type="button"
            onClick={onOpenTelegram}
            className="mt-6 w-full rounded-[24px] bg-brand-blue py-4 text-base font-semibold text-white transition hover:brightness-[1.02] focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
          >
            Telegramda ochish
          </button>
        ) : null}

        {shouldShowRetryButton ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 w-full rounded-[24px] bg-brand-blue py-4 text-base font-semibold text-white transition hover:brightness-[1.02] focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
          >
            Qayta urinish
          </button>
        ) : null}
      </section>
    </div>
  )
}
