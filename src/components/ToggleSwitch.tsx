type ToggleSwitchProps = {
  checked: boolean
  label: string
  onChange: (next: boolean) => void
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 12a8 8 0 1 1-3.1-6.3M8.5 12.5l2.2 2.2 5.8-6.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ToggleSwitch({
  checked,
  label,
  onChange,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-start justify-between gap-3 sm:items-center">
      <div className="flex min-w-0 items-start gap-3 text-brand-ink">
        <CheckIcon />
        <div className="min-w-0 text-[1.05rem] font-semibold leading-6">
          {label}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={
          checked
            ? 'relative h-8 w-14 shrink-0 rounded-full bg-brand-blue transition'
            : 'relative h-8 w-14 shrink-0 rounded-full bg-brand-soft transition'
        }
      >
        <span
          className={
            checked
              ? 'absolute left-[30px] top-1 h-6 w-6 rounded-full bg-white shadow transition'
              : 'absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition'
          }
        />
      </button>
    </div>
  )
}
