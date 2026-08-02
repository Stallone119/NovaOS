import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileLoading() {
  return (
    <div className="max-w-lg space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4 rounded-xl border border-slate-200 p-6">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
