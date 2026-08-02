'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut } from 'lucide-react'
import { NAV_BY_ROLE, ROLE_LABEL, type Role } from '@/lib/nav'

export function MobileNav({ fullName, role, department }: { fullName: string; role: Role; department: string }) {
  const [open, setOpen] = useState(false)
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
    <div className="md:hidden">
      <div className="flex items-center justify-between border-b border-slate-200 bg-[#0F1729] px-4 py-3 text-white">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-[#C9A227]">Nova Summit</div>
          <div className="text-sm font-semibold">2027 Tracker</div>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 text-white/80 hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#0F1729] text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-[#C9A227]">Nova Summit</div>
                <div className="text-sm font-semibold">2027 Tracker</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-2 text-white/80 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
                    onClick={() => setOpen(false)}
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
                <div className="text-xs text-white/50">{ROLE_LABEL[role] ?? role} · {department}</div>
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
          </div>
        </div>
      )}
    </div>
  )
}
