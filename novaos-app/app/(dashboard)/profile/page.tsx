import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/get-profile'
import { ProfileForm } from '@/components/profile-form'

export default async function ProfilePage() {
  const profile = await getUserProfile()
  if (!profile) redirect('/auth/login')

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Your Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Update your contact info and avatar.</p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  )
}
