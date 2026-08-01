import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/get-profile'

export default async function DashboardHome() {
  const profile = await getUserProfile()
  if (!profile) redirect('/auth/login')

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome back, {profile.full_name}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {profile.role === 'executive'
          ? "Here's how planning is tracking across all departments."
          : "Here's what's on your plate."}
      </p>
    </div>
  )
}
