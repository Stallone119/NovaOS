'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Task, TaskStatus } from '@/lib/types'

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
]

const MAX_FILE_MB = 10
const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export function ReportDialog({
  task,
  onSubmitted,
}: {
  task: Task
  onSubmitted: (taskId: string, newStatus: TaskStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [blocker, setBlocker] = useState('')
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function resetForm() {
    setContent('')
    setBlocker('')
    setStatus(task.status)
    setFile(null)
    setError(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) { setFile(null); return }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File too large — max ${MAX_FILE_MB}MB.`)
      e.target.value = ''
      return
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Only images, PDFs, or Word docs are allowed.')
      e.target.value = ''
      return
    }
    setError(null)
    setFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) {
      setError('Please describe what you accomplished.')
      return
    }
    setError(null)
    setSubmitting(true)

    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in.')

      let file_url: string | null = null

      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const path = `${task.department}/${task.id}/${Date.now()}_${safeName}`
        const { error: uploadError } = await supabase.storage
          .from('report-attachments')
          .upload(path, file)
        if (uploadError) throw uploadError
        file_url = path
      }

      const { error: insertError } = await supabase.from('reports').insert({
        task_id: task.id,
        user_id: user.id,
        content: content.trim(),
        blocker: blocker.trim() || null,
        status_update: status,
        file_url,
      })
      if (insertError) throw insertError

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', task.id)
      if (updateError) throw updateError

      onSubmitted(task.id, status)
      resetForm()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm() }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Log Report</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Report — {task.title}</DialogTitle>
          <DialogDescription>Share a quick update on this task.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">What did you accomplish? *</label>
            <Textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Finalized the AV vendor contract and scheduled the walkthrough."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Blockers / issues</label>
            <Textarea
              rows={2}
              value={blocker}
              onChange={(e) => setBlocker(e.target.value)}
              placeholder="Optional — anything holding this up?"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Update status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Attachment</label>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-50"
            />
            {file && <p className="text-xs text-slate-500">{file.name}</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-[#0F1729] hover:bg-[#0F1729]/90">
              {submitting ? 'Submitting…' : 'Submit report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
