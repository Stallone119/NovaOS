'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ReportDialog } from '@/components/tasks/report-dialog'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
]

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  not_started: 'bg-slate-100 text-slate-600 border-slate-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  review: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  delayed: 'bg-red-100 text-red-700 border-red-200',
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return '—'
  return new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(deadline: string | null, status: TaskStatus) {
  if (!deadline || status === 'completed') return false
  return new Date(deadline) < new Date(new Date().toDateString())
}

export function TasksTable({
  initialTasks,
  showAssignee,
}: {
  initialTasks: Task[]
  showAssignee: boolean
}) {
  const [tasks, setTasks] = useState(initialTasks)
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      return true
    })
  }, [tasks, statusFilter, priorityFilter])

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    setUpdatingId(taskId)
    const supabase = createClient()
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    setUpdatingId(null)
    if (error) {
      alert(`Couldn't update status: ${error.message}`)
      return
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))
  }

  function handleReportSubmitted(taskId: string, newStatus: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | TaskStatus)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as 'all' | TaskPriority)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-16 text-center text-sm text-slate-500">
          No tasks match these filters.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  {showAssignee && <th className="px-4 py-3 font-medium">Assignee</th>}
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task.id} className="border-b border-slate-200 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{task.title}</td>
                    {showAssignee && (
                      <td className="px-4 py-3 text-slate-500">
                        {task.profiles?.full_name ?? 'Unassigned'}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={PRIORITY_STYLES[task.priority]}>
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={task.status}
                        onValueChange={(v) => handleStatusChange(task.id, v as TaskStatus)}
                        disabled={updatingId === task.id}
                      >
                        <SelectTrigger className={`h-8 w-36 text-xs ${STATUS_STYLES[task.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className={`px-4 py-3 ${isOverdue(task.deadline, task.status) ? 'font-medium text-red-600' : ''}`}>
                      {formatDeadline(task.deadline)}
                      {isOverdue(task.deadline, task.status) && ' · Overdue'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ReportDialog task={task} onSubmitted={handleReportSubmitted} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((task) => (
              <div key={task.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="font-medium text-slate-900">{task.title}</div>
                  <Badge variant="outline" className={PRIORITY_STYLES[task.priority]}>
                    {task.priority}
                  </Badge>
                </div>
                {showAssignee && (
                  <div className="mb-2 text-xs text-slate-500">
                    {task.profiles?.full_name ?? 'Unassigned'}
                  </div>
                )}
                <div className={`mb-3 text-xs ${isOverdue(task.deadline, task.status) ? 'font-medium text-red-600' : 'text-slate-500'}`}>
                  Due {formatDeadline(task.deadline)}
                  {isOverdue(task.deadline, task.status) && ' · Overdue'}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={task.status}
                    onValueChange={(v) => handleStatusChange(task.id, v as TaskStatus)}
                    disabled={updatingId === task.id}
                  >
                    <SelectTrigger className={`h-8 flex-1 text-xs ${STATUS_STYLES[task.status]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ReportDialog task={task} onSubmitted={handleReportSubmitted} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
