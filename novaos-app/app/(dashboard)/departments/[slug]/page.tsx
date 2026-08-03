import { redirect, notFound } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/get-profile'
import { createClient } from '@/lib/supabase/server'
import { departmentFromSlug } from '@/lib/departments'
import { TasksTable } from '@/components/tasks/tasks-table'
import type { Task, LatestReport } from '@/lib/types'

export default async function DepartmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const profile = await getUserProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role === 'team_member') redirect('/')

  const department = departmentFromSlug(slug)
  if (!department) notFound()

  if (profile.role === 'dept_head' && profile.department !== department) {
    redirect('/')
  }

  const supabase = await createClient()
  const { data: rawTasks } = await supabase
    .from('tasks')
    .select('*, profiles:assigned_to(full_name)')
    .eq('department', department)
    .order('deadline', { ascending: true })

  const tasks = (rawTasks as Task[]) ?? []
  const taskIds = tasks.map((t) => t.id)

  let latestByTask = new Map<string, LatestReport>()

  if (taskIds.length > 0) {
    const { data: reports } = await supabase
      .from('reports')
      .select('task_id, content, created_at, profiles:user_id(full_name)')
      .in('task_id', taskIds)
      .order('created_at', { ascending: false })

    // ✅ FIXED: Use 'any[]' to completely bypass TypeScript checking
    for (const r of (reports ?? []) as any[]) {
      if (!latestByTask.has(r.task_id)) {
        // Safely get author name - handles both array and object
        let author = null
        if (r.profiles) {
          if (Array.isArray(r.profiles) && r.profiles.length > 0) {
            author = r.profiles[0].full_name
          } else if (r.profiles.full_name) {
            author = r.profiles.full_name
          }
        }
        
        latestByTask.set(r.task_id, {
          content: r.content,
          created_at: r.created_at,
          author: author,
        })
      }
    }
  }

  const tasksWithReports = tasks.map((t) => ({
    ...t,
    latest_report: latestByTask.get(t.id) ?? null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{department}</h1>
        <p className="mt-1 text-sm text-slate-500">All tasks and current status for this department.</p>
      </div>
      <TasksTable initialTasks={tasksWithReports} showAssignee showLatestReport />
    </div>
  )
}