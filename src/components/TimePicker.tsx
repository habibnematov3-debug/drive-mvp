type TimePickerProps = {
  label?: string
  value: string
  onChange: (next: string) => void
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 7.5V12l3 2M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function TimePicker({
  label = 'Vaqt',
  value,
  onChange,
}: TimePickerProps) {
  return (
    <section className="rounded-[28px] border border-brand-line bg-white p-4 shadow-soft">
      <label className="block text-sm font-semibold text-brand-ink">
        {label}
      </label>
      <div className="relative mt-3">
        <input
          type="time"
          value={value}
          step={900}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-[20px] border border-brand-line bg-white px-4 py-3 text-base text-brand-ink outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10"
        />
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-brand-muted">
          <ClockIcon />
        </div>
      </div>
    </section>
  )
}
