type HeaderProps = {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="px-4 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[2rem] font-black leading-none tracking-[-0.04em] text-brand-blue">
            {title}
          </h1>
          {subtitle ? (
            <div className="mt-1 text-xs font-medium text-brand-muted">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
