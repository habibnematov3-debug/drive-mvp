import type { ReactNode } from 'react'
import type { TabKey } from '../types/drivee'
import BottomNav from './BottomNav'
import Header from './Header'

type AppLayoutProps = {
  headerTitle: string
  headerSubtitle?: string
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  children: ReactNode
}

export default function AppLayout({
  headerTitle,
  headerSubtitle,
  activeTab,
  onTabChange,
  children,
}: AppLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-bg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-28 h-64 w-64 rounded-full bg-brand-blue/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 top-40 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl"
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header title={headerTitle} subtitle={headerSubtitle} />
        <main
          className="flex-1 px-4"
          style={{
            paddingBottom: 'calc(6.25rem + env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </main>
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </div>
  )
}
