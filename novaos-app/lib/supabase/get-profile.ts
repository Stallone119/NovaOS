import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getUserProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, department, phone_number, avatar_url')
    .eq('id', user.id)
    .single()

  return profile
})
