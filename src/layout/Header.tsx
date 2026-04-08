type HeaderProps = {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.85rem)]">
      <div className="rounded-[28px] border border-brand-line bg-white/90 px-4 py-4 shadow-soft backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[1.95rem] font-black leading-none tracking-[-0.04em] text-brand-blue">
              {title}
            </h1>
            {subtitle ? (
              <div className="mt-1 text-xs font-medium text-brand-muted">
                {subtitle}
              </div>
            ) : null}
          </div>

          <div className="rounded-full border border-brand-blue/20 bg-brand-blue-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-blue">
            Mini App
          </div>
        </div>
      </div>
    </header>
  )
}
