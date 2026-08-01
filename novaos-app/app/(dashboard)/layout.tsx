import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/get-profile'
import { Sidebar } from '@/components/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserProfile()
  if (!profile) redirect('/auth/login')

  return (
    <div className="flex min-h-svh bg-[#FAFAF8]">
      <Sidebar fullName={profile.full_name} role={profile.role} department={profile.department} />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  )
}
