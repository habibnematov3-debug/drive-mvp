import { cn } from '../lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-lg border border-brand-line bg-white p-4 shadow-soft', className)}>
      {children}
    </div>
  )
}

export function Chip({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-3 py-2 text-xs font-extrabold text-brand-ink',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PrimaryButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'w-full rounded-[20px] bg-brand-blue px-4 py-3 text-sm font-black text-white shadow-soft shadow-brand-blue/15 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-brand-blue/40',
        className,
      )}
    />
  )
}

export function SecondaryButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'w-full rounded-[20px] border border-brand-line bg-white px-4 py-3 text-sm font-black text-brand-ink transition active:scale-[0.99] disabled:cursor-not-allowed disabled:text-brand-muted',
        className,
      )}
    />
  )
}
