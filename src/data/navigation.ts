import type { TabKey } from '../types/drivee'

export type NavItem = {
  tab: TabKey
  label: string
}

export const navItems: NavItem[] = [
  { tab: 'home', label: 'Bosh sahifa' },
  { tab: 'orders', label: 'Arizalar' },
  { tab: 'profile', label: 'Profil' },
]
