import { redirect, notFound } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/get-profile'
import { createClient } from '@/lib/supabase/server'
import { departmentFromSlug } from '@/lib/departments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DEPARTMENTS } from '@/lib/departments'

export default async function DepartmentDetailPage({ params }: { params: { slug: string } }) {
  const profile = await getUserProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role === 'team_member') redirect('/')

  const department = departmentFromSlug(params.slug)
  if (!department) notFound()

  if (profile.role === 'dept_head' && profile.department !== department) {
    redirect('/')
  }

  const supabase = await createClient()
  
  // Get tasks for this department
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('department', department)
    .order('deadline', { ascending: true })

  const taskList = tasks ?? []
  const totalTasks = taskList.length
  const completedTasks = taskList.filter((t: any) => t.status === 'completed').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{department}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {totalTasks} tasks • {completedTasks} completed
        </p>
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

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {taskList.length === 0 ? (
            <p className="text-sm text-slate-500">No tasks for this department yet.</p>
          ) : (
            <div className="space-y-2">
              {taskList.map((task: any) => (
                <div key={task.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-slate-500">{task.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    task.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                    task.status === 'delayed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}