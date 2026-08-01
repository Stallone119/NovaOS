'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, ListChecks, Building2, ClipboardList, LogOut } from 'lucide-react'

type Role = 'executive' | 'dept_head' | 'team_member'

const NAV_BY_ROLE: Record<Role, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  executive: [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'All Tasks', icon: ListChecks },
    { href: '/departments', label: 'Departments', icon: Building2 },
  ],
  dept_head: [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'Department Tasks', icon: ClipboardList },
  ],
  team_member: [{ href: '/', label: 'My Tasks', icon: ClipboardList }],
}

const ROLE_LABEL: Record<Role, string> = {
  executive: 'Executive',
  dept_head: 'Dept Head',
  team_member: 'Team Member',
}

export function Sidebar({ fullName, role, department }: { fullName: string; role: Role; department: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const items = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.team_member

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-[#E5E1D8] bg-[#0F1729] text-white">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="text-xs font-medium uppercase tracking-widest text-[#C9A227]">Nova Summit</div>
        <div className="text-lg font-semibold">2027 Tracker</div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-3 px-2">
          <div className="truncate text-sm font-medium">{fullName}</div>
          <div className="text-xs text-white/50">{ROLE_LABEL[role] ?? role} Â· {department}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-2 text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
