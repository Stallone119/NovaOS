import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/get-profile'
import { TasksTable } from '@/components/tasks/tasks-table'

export default async function TasksPage() {
  const profile = await getUserProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select('*, profiles:assigned_to(full_name)')
    .order('deadline', { ascending: true })

  if (profile.role === 'team_member') {
    query = query.eq('assigned_to', profile.id)
  } else if (profile.role === 'dept_head') {
    query = query.eq('department', profile.department)
  }

  const { data: tasks, error } = await query

  if (error) {
    return <div className="text-sm text-red-600">Failed to load tasks: {error.message}</div>
  }

  const heading =
    profile.role === 'team_member'
      ? 'My Tasks'
      : profile.role === 'dept_head'
        ? `${profile.department} Tasks`
        : 'All Tasks'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{heading}</h1>
        <p className="text-sm text-slate-500">
          {tasks?.length ?? 0} task{tasks?.length === 1 ? '' : 's'}
        </p>
      </div>
      <TasksTable initialTasks={tasks ?? []} showAssignee={profile.role !== 'team_member'} />
    </div>
  )
}
