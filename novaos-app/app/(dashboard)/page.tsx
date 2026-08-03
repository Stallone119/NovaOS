import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  let fullName = user.email?.split('@')[0] || 'User'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    if (profile?.full_name) {
      fullName = profile.full_name
    }
  } catch (e) {
    // Profile might not exist yet - use email name
  }

  // Get tasks count
  let taskCount = 0
  let completedCount = 0
  try {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status')
    if (tasks) {
      taskCount = tasks.length
      completedCount = tasks.filter((t: any) => t.status === 'completed').length
    }
  } catch (e) {
    // Tasks table might not exist yet
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome, {fullName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Nova Summit 2027 Command Center</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <p className="text-3xl font-semibold text-slate-900">{taskCount}</p>
          <p className="mt-1 text-sm text-slate-500">Total Tasks</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <p className="text-3xl font-semibold text-green-600">{completedCount}</p>
          <p className="mt-1 text-sm text-slate-500">Completed</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <p className="text-3xl font-semibold text-yellow-600">{taskCount - completedCount}</p>
          <p className="mt-1 text-sm text-slate-500">In Progress</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Getting Started</h2>
        <p className="text-sm text-slate-500">
          {taskCount === 0 
            ? 'No tasks found. Start by adding tasks to your database.'
            : 'Your NovaOS dashboard is ready!'
          }
        </p>
        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
          <p>📌 Departments: Marketing, Logistics, Finance, Protocol, Media, Hospitality, Registration</p>
        </div>
      </div>
    </div>
  )
}