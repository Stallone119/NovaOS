import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/get-profile'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { DEPARTMENTS, departmentSlug } from '@/lib/departments'

export default async function DashboardHome() {
  const profile = await getUserProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()
  
  // Simple query - no complex types
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')

  const taskList = tasks ?? []
  const totalTasks = taskList.length
  const completedTasks = taskList.filter((t: any) => t.status === 'completed').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome, {profile.full_name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Nova Summit 2027 Command Center</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-semibold text-slate-900">{totalTasks}</div>
            <div className="mt-1 text-sm text-slate-500">Total Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-semibold text-green-600">{completedTasks}</div>
            <div className="mt-1 text-sm text-slate-500">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-semibold text-yellow-600">{totalTasks - completedTasks}</div>
            <div className="mt-1 text-sm text-slate-500">In Progress</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEPARTMENTS.map((dept) => {
          const deptTasks = taskList.filter((t: any) => t.department === dept)
          const completed = deptTasks.filter((t: any) => t.status === 'completed').length
          
          return (
            <Link key={dept} href={`/departments/${departmentSlug(dept)}`}>
              <Card className="border-slate-200 transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{dept}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-slate-900">
                    {completed}/{deptTasks.length}
                  </div>
                  <div className="text-xs text-slate-500">tasks completed</div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full bg-[#0F1729]"
                      style={{ 
                        width: deptTasks.length > 0 
                          ? `${(completed / deptTasks.length) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {taskList.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
          No tasks found. Add your first task to get started.
        </div>
      )}
    </div>
  )
}