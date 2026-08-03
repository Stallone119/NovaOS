import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DEPARTMENTS = ['Marketing', 'Logistics', 'Finance', 'Protocol', 'Media', 'Hospitality', 'Registration']

export default async function DepartmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get tasks
  let tasks: any[] = []
  try {
    const { data } = await supabase.from('tasks').select('department, status')
    tasks = data ?? []
  } catch (e) {
    // Table might not exist
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Departments</h1>
        <p className="mt-1 text-sm text-slate-500">View progress by department</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEPARTMENTS.map((dept) => {
          const deptTasks = tasks.filter((t) => t.department === dept)
          const completed = deptTasks.filter((t) => t.status === 'completed').length
          
          return (
            <Link key={dept} href={`/departments/${dept.toLowerCase()}`}>
              <Card className="border-slate-200 transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{dept}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-slate-900">
                    {completed}/{deptTasks.length}
                  </div>
                  <div className="text-xs text-slate-500">tasks completed</div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}