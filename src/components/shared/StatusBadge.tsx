import { Badge } from '@/components/ui/badge'

type FeeStatus = 'paid' | 'partial' | 'pending' | 'overdue'
type StudentStatus = 'active' | 'exited'
type ComplaintStatus = 'open' | 'in_progress' | 'resolved'
type Priority = 'low' | 'medium' | 'high' | 'urgent'

export function FeeStatusBadge({ status }: { status: FeeStatus }) {
  const map = {
    paid:    { label: 'Paid',    variant: 'success'  as const },
    partial: { label: 'Partial', variant: 'warning'  as const },
    pending: { label: 'Pending', variant: 'muted'    as const },
    overdue: { label: 'Overdue', variant: 'danger'   as const },
  }
  const { label, variant } = map[status] ?? map.pending
  return <Badge variant={variant}>{label}</Badge>
}

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return status === 'active'
    ? <Badge variant="success">Active</Badge>
    : <Badge variant="muted">Exited</Badge>
}

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const map = {
    open:        { label: 'Open',        variant: 'danger'  as const },
    in_progress: { label: 'In Progress', variant: 'warning' as const },
    resolved:    { label: 'Resolved',    variant: 'success' as const },
  }
  const { label, variant } = map[status] ?? map.open
  return <Badge variant={variant}>{label}</Badge>
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const map = {
    low:    { label: 'Low',    variant: 'muted'   as const },
    medium: { label: 'Medium', variant: 'warning' as const },
    high:   { label: 'High',   variant: 'danger'  as const },
    urgent: { label: 'Urgent', variant: 'danger'  as const },
  }
  const { label, variant } = map[priority] ?? map.medium
  return <Badge variant={variant}>{label}</Badge>
}
