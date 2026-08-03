import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/get-profile'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DEPARTMENTS, departmentSlug } from '@/lib/departments'

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
  
  try {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', userId)
      .order('deadline', { ascending: true })

    const taskCount = tasks?.length || 0
    const completedCount = tasks?.filter((t) => t.status === 'completed').length || 0

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {fullName}</h1>
          <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s on your plate.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-semibold text-slate-900">{taskCount}</div>
              <div className="mt-1 text-sm text-slate-500">My Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-semibold text-green-600">{completedCount}</div>
              <div className="mt-1 text-sm text-slate-500">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-semibold text-yellow-600">{taskCount - completedCount}</div>
              <div className="mt-1 text-sm text-slate-500">In Progress</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-900">{task.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No tasks assigned yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error('Team member dashboard error:', error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {fullName}</h1>
          <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s on your plate.</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          <p className="text-sm">Unable to load your tasks. Please check your connection.</p>
        </div>
      </div>
    )
  }
}

async function StatsHome({ role, department }: { role: string; department: string }) {
  const supabase = await createClient()

  try {
    // Fetch tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')

    const taskList = tasks ?? []
    const scopeDepartments = role === 'executive' ? DEPARTMENTS : [department]

    const totalTasks = taskList.length
    const completedTasks = taskList.filter((t) => t.status === 'completed').length
    const overdueTasks = taskList.filter((t) => {
      if (!t.deadline || t.status === 'completed') return false
      return new Date(t.deadline) < new Date()
    })

    const deptProgress = scopeDepartments.map((dept) => {
      const deptTasks = taskList.filter((t) => t.department === dept)
      const completed = deptTasks.filter((t) => t.status === 'completed').length
      return { department: dept, total: deptTasks.length, completed }
    })

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
          <StatCard label="Completed" value={completedTasks} tone={completedTasks > 0 ? 'success' : 'default'} />
          <StatCard label="Overdue" value={overdueTasks.length} tone={overdueTasks.length > 0 ? 'danger' : 'default'} />
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            {role === 'executive' ? 'Department Progress' : 'Your Department Progress'}
          </h2>
          {deptProgress.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              No departments found.
            </div>
          ) : (
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
          )}
        </div>

        {taskList.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
            No tasks found. Start by adding some tasks to get started.
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Nova Summit 2027 planning overview.</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-700">⚠️ Error Loading Dashboard</h2>
          <p className="text-red-600 mt-2">Unable to load dashboard data.</p>
          <p className="text-red-500 text-sm mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    )
  }
}

function StatCard({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'success' | 'danger' | 'warning' }) {
  const toneClass = 
    tone === 'danger' ? 'text-red-600' : 
    tone === 'warning' ? 'text-amber-600' : 
    tone === 'success' ? 'text-green-600' : 
    'text-slate-900'
  
  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <div className={`text-3xl font-semibold ${toneClass}`}>{value}</div>
        <div className="mt-1 text-sm text-slate-500">{label}</div>
      </CardContent>
    </Card>
  )
}