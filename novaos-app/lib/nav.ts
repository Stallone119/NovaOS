import { LayoutDashboard, ListChecks, Building2, ClipboardList, UserCircle } from 'lucide-react'

export type Role = 'executive' | 'dept_head' | 'team_member'

export const NAV_BY_ROLE: Record<Role, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  executive: [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'All Tasks', icon: ListChecks },
    { href: '/departments', label: 'Departments', icon: Building2 },
    { href: '/profile', label: 'Profile', icon: UserCircle },
  ],
  dept_head: [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'Department Tasks', icon: ClipboardList },
    { href: '/profile', label: 'Profile', icon: UserCircle },
  ],
  team_member: [
    { href: '/', label: 'My Tasks', icon: ClipboardList },
    { href: '/profile', label: 'Profile', icon: UserCircle },
  ],
}

export const ROLE_LABEL: Record<Role, string> = {
  executive: 'Executive',
  dept_head: 'Dept Head',
  team_member: 'Team Member',
}
