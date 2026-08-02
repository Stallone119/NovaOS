import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/get-profile'
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserProfile()
  if (!profile) redirect('/auth/login')

  return (
    <div className="flex min-h-svh flex-col bg-[#FAFAF8] md:flex-row">
      <MobileNav fullName={profile.full_name} role={profile.role} department={profile.department} />
      <Sidebar fullName={profile.full_name} role={profile.role} department={profile.department} />
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  )
}
