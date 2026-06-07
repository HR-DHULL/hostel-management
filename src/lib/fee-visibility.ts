/**
 * Determines whether a fee row should be visible for a given period
 * given the member's status. The rule:
 *
 *   - Active members: always visible.
 *   - Exited members WITH an exit_date: visible only when the fee's
 *     (year, month) is at or before the exit (year, month). Fees from
 *     months strictly after the exit month are hidden.
 *   - Exited members WITHOUT an exit_date (legacy/imported rows): we
 *     don't know when they exited. Treat exit as "earlier than today"
 *     and hide every fee whose period is the current month or later.
 *     Past months stay visible so paid history is preserved.
 *
 * NOTE: the `member` argument is the embedded record from a Supabase join
 * (e.g. `hostel_students(status, exit_date)`). Depending on how PostgREST
 * resolves the relationship it can arrive as a single object OR as a
 * one-element array. If it arrives as an array and we read `.status` off the
 * array, it is `undefined`, the member looks "active", and EVERY exited
 * member leaks through. We normalise the shape here so callers can't be
 * silently defeated by it.
 */
type EmbeddedMember = { status?: string | null; exit_date?: string | null }

export function isFeeVisibleForExit(
  member: EmbeddedMember | EmbeddedMember[] | null | undefined,
  fee: { year: number; month: number }
): boolean {
  const m = Array.isArray(member) ? member[0] : member
  if (!m) return true
  if (m.status !== 'exited') return true

  if (m.exit_date) {
    const d = new Date(m.exit_date)
    const exitYear  = d.getFullYear()
    const exitMonth = d.getMonth() + 1
    if (fee.year < exitYear) return true
    if (fee.year === exitYear && fee.month <= exitMonth) return true
    return false
  }

  // Exited with no exit_date: hide current month + future, show past only.
  const now      = new Date()
  const nowYear  = now.getFullYear()
  const nowMonth = now.getMonth() + 1
  if (fee.year < nowYear) return true
  if (fee.year === nowYear && fee.month < nowMonth) return true
  return false
}
