type PassengerCountSelectorProps = {
  value: number
  onChange: (next: number) => void
}

function PeopleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 11a3.25 3.25 0 1 0 0-6.5A3.25 3.25 0 0 0 8 11ZM16 10a2.75 2.75 0 1 0 0-5.5A2.75 2.75 0 0 0 16 10ZM3.5 18.5A4.5 4.5 0 0 1 8 14h.5a4.5 4.5 0 0 1 4.5 4.5M14 18.5a3.5 3.5 0 0 1 6.5-1.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function PassengerCountSelector({
  value,
  onChange,
}: PassengerCountSelectorProps) {
  return (
    <div>
      <div className="flex items-center gap-3 text-brand-ink">
        <PeopleIcon />
        <div className="text-[1.05rem] font-semibold">Yo'lovchilar soni</div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => onChange(count)}
            className={
              count === value
                ? 'rounded-[18px] bg-brand-blue px-3 py-3 text-base font-semibold text-white shadow-soft transition'
                : 'rounded-[18px] bg-brand-soft px-3 py-3 text-base font-semibold text-brand-ink transition'
            }
          >
            {count}
          </button>
        ))}
      </div>
    </div>
  )
}
