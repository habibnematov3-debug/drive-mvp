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
    <div className="min-h-screen bg-brand-bg flex flex-col">
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
  )
}
