import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/get-profile'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DEPARTMENTS, departmentSlug } from '@/lib/departments'

export default async function DepartmentsIndexPage() {
  const profile = await getUserProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role === 'team_member') redirect('/')
  if (profile.role === 'dept_head') redirect(`/departments/${departmentSlug(profile.department)}`)

  const supabase = await createClient()
  const { data: tasks } = await supabase.from('tasks').select('id, department, status')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Departments</h1>
        <p className="mt-1 text-sm text-slate-500">Drill into any department&apos;s planning progress.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEPARTMENTS.map((dept) => {
          const deptTasks = (tasks ?? []).filter((t) => t.department === dept)
          const completed = deptTasks.filter((t) => t.status === 'completed').length
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
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
