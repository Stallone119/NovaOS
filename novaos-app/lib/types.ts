export type TaskStatus = 'not_started' | 'in_progress' | 'review' | 'completed' | 'delayed'
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

export interface LatestReport {
  content: string
  created_at: string
  author: string | null
}

export interface Task {
  id: string
  title: string
  description: string | null
  department: string
  assigned_to: string | null
  status: TaskStatus
  priority: TaskPriority
  deadline: string | null
  created_at: string
  updated_at: string
  profiles?: { full_name: string } | null
  latest_report?: LatestReport | null
}
