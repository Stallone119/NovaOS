import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/get-profile'
import { createClient } from '@/lib/supabase/server'
import { TasksTable } from '@/components/tasks/tasks-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DEPARTMENTS, departmentSlug } from '@/lib/departments'
import type { Task } from '@/lib/types'

export default async function DashboardHome() {
  const profile = await getUserProfile()
  if (!profile) redirect('/auth/login')

  if (profile.role === 'team_member') {
    return <TeamMemberHome fullName={profile.full_name} userId={profile.id} />
  }

  return <StatsHome role={profile.role} department={profile.department} />
}

async function TeamMemberHome({ fullName, userId }: { fullName: string; userId: string }) {
  const supabase = await createClient()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, profiles:assigned_to(full_name)')
    .eq('assigned_to', userId)
    .order('deadline', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {fullName}</h1>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s on your plate.</p>
      </div>
      <TasksTable initialTasks={(tasks as Task[]) ?? []} showAssignee={false} />
    </div>
  )
}

async function StatsHome({ role, department }: { role: string; department: string }) {
  const supabase = await createClient()

  let taskQuery = supabase.from('tasks').select('id, status, priority, deadline, department, title')
  if (role === 'dept_head') taskQuery = taskQuery.eq('department', department)
  const { data: tasks } = await taskQuery

  const scopeDepartments = role === 'executive' ? DEPARTMENTS : [department]
  const taskIds = (tasks ?? []).map((t) => t.id)

  // ✅ FIXED: Use 'any' to bypass type checking
  let reports: any[] = []

  if (taskIds.length > 0) {
    const { data } = await supabase
      .from('reports')
      .select('task_id, created_at, content, profiles:user_id(full_name), tasks:task_id(title)')
      .in('task_id', taskIds)
      .order('created_at', { ascending: false })
    reports = data ?? []
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const today = new Date(now.toDateString())

  const totalTasks = tasks?.length ?? 0
  const overdueTasks = (tasks ?? []).filter(
    (t) => t.deadline && new Date(t.deadline) < today && t.status !== 'completed'
  )

  const latestReportByTask = new Map<string, string>()
  for (const r of reports) {
    if (!latestReportByTask.has(r.task_id)) latestReportByTask.set(r.task_id, r.created_at)
  }
  const stalledTasks = (tasks ?? []).filter((t) => {
    if (t.status === 'completed') return false
    const latest = latestReportByTask.get(t.id)
    if (!latest) return true
    return new Date(latest) < sevenDaysAgo
  })

  const deptProgress = scopeDepartments.map((dept) => {
    const deptTasks = (tasks ?? []).filter((t) => t.department === dept)
    const completed = deptTasks.filter((t) => t.status === 'completed').length
    return { department: dept, total: deptTasks.length, completed }
  })

  const recentActivity = reports.slice(0, 10)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {role === 'executive' ? 'Executive Dashboard' : `${department} Dashboard`}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Nova Summit 2027 planning overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Tasks" value={totalTasks} />
        <StatCard label="Overdue" value={overdueTasks.length} tone={overdueTasks.length > 0 ? 'danger' : 'default'} />
        <StatCard label="Stalled (no update in 7d)" value={stalledTasks.length} tone={stalledTasks.length > 0 ? 'warning' : 'default'} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          {role === 'executive' ? 'Department Progress' : 'Your Department Progress'}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deptProgress.map((d) => (
            <Link key={d.department} href={`/departments/${departmentSlug(d.department)}`}>
              <Card className="border-slate-200 transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{d.department}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-slate-900">
                    {d.completed}/{d.total}
                  </div>
                  <div className="text-xs text-slate-500">tasks completed</div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full bg-[#0F1729]"
                      style={{ width: d.total > 0 ? `${(d.completed / d.total) * 100}%` : '0%' }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
            No reports logged yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {recentActivity.map((r, i) => {
              // ✅ Safely get author name (handles both array and object)
              let authorName = 'Someone'
              if (r.profiles) {
                if (Array.isArray(r.profiles) && r.profiles.length > 0) {
                  authorName = r.profiles[0].full_name
                } else if (r.profiles.full_name) {
                  authorName = r.profiles.full_name
                }
              }
              
              // ✅ Safely get task title (handles both array and object)
              let taskTitle = 'a task'
              if (r.tasks) {
                if (Array.isArray(r.tasks) && r.tasks.length > 0) {
                  taskTitle = r.tasks[0].title
                } else if (r.tasks.title) {
                  taskTitle = r.tasks.title
                }
              }
              
              return (
                <div key={i} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                  <div>
                    <span className="font-medium text-slate-900">{authorName}</span>
                    <span className="text-slate-500"> logged a report on </span>
                    <span className="font-medium text-slate-900">{taskTitle}</span>
                    <p className="mt-0.5 text-slate-500">{r.content}</p>
                  </div>
                  <div className="shrink-0 whitespace-nowrap text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'danger' | 'warning' }) {
  const toneClass = tone === 'danger' ? 'text-red-600' : tone === 'warning' ? 'text-amber-600' : 'text-slate-900'
  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <div className={`text-3xl font-semibold ${toneClass}`}>{value}</div>
        <div className="mt-1 text-sm text-slate-500">{label}</div>
      </CardContent>
    </Card>
  )
}