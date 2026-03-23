import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPortalProfile } from '@/lib/queries/portal'
import { ComplaintForm } from '@/components/portal/ComplaintForm'

export const metadata: Metadata = { title: 'Raise Complaint' }
export const dynamic = 'force-dynamic'

export default async function RaiseComplaintPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const profile = await getPortalProfile(user.id)
  if (!profile?.linked_student_id) redirect('/portal/dashboard')

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Raise a Complaint</h1>
        <p className="text-sm text-slate-500 mt-0.5">Describe your issue and we'll look into it</p>
      </div>

      <div className="rounded-lg border border-border bg-white p-5">
        <ComplaintForm studentId={profile.linked_student_id} />
      </div>
    </div>
  )
}
