import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-900">NovaOS</h1>
          <p className="text-xs text-slate-500 mt-1">{user.email}</p>
        </div>
        <nav className="space-y-1">
          <Link href="/" className="block px-3 py-2 rounded-lg bg-slate-100 text-slate-900 text-sm font-medium">
            Dashboard
          </Link>
          <Link href="/departments" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm">
            Departments
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}