'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ROLE_LABEL, type Role } from '@/lib/nav'

interface ProfileData {
  id: string
  full_name: string
  role: Role
  department: string
  phone_number?: string | null
  avatar_url?: string | null
}

export function ProfileForm({ profile }: { profile: ProfileData }) {
  const router = useRouter()
  const [phone, setPhone] = useState(profile.phone_number ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Image must be under 3MB.')
      return
    }
    setError(null)
    setAvatarFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    const supabase = createClient()

    try {
      let newAvatarUrl = avatarUrl

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() ?? 'jpg'
        const path = `${profile.id}/avatar.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true })
        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        newAvatarUrl = `${data.publicUrl}?t=${Date.now()}`
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone_number: phone.trim() || null, avatar_url: newAvatarUrl })
        .eq('id', profile.id)
      if (updateError) throw updateError

      setAvatarUrl(newAvatarUrl)
      setAvatarFile(null)
      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const displayAvatar = previewUrl ?? avatarUrl

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
          {displayAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayAvatar} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-400">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <label className="inline-block cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Change photo
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
          <p className="mt-1 text-xs text-slate-400">JPG or PNG, up to 3MB</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Name</div>
          <div className="mt-1 text-slate-900">{profile.full_name}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Role</div>
          <div className="mt-1 text-slate-900">{ROLE_LABEL[profile.role]}</div>
        </div>
        <div className="col-span-2">
          <div className="text-xs uppercase tracking-wide text-slate-400">Department</div>
          <div className="mt-1 text-slate-900">{profile.department}</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Phone number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 123-4567"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Profile updated.</p>}

      <Button type="submit" disabled={saving} className="bg-[#0F1729] hover:bg-[#0F1729]/90">
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
