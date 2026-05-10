import type { TabKey } from '../types/drivee'

export type NavItem = {
  tab: TabKey
}

export const navItems: NavItem[] = [
  { tab: 'home' },
  { tab: 'orders' },
  { tab: 'profile' },
]
