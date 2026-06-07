/**
 * Determines whether a fee row should be visible for a given period
 * given the member's status. The rule:
 *
 *   - Active members: always visible.
 *   - Exited members are NEVER shown for the current calendar month or any
 *     future month, regardless of the recorded exit_date. This matters
 *     because the "Mark as exited" dialog defaults exit_date to today, so a
 *     member who actually left earlier would otherwise carry a current-month
 *     exit date and keep appearing in the live report. Once someone has left,
 *     they drop off the ongoing reports immediately.
 *   - For PAST months, an exited member stays visible so paid history is
 *     preserved — but if an explicit exit_date is recorded, they are hidden
 *     for any month after the one they actually left.
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

  // Exited members are hidden for the current month and everything after it,
  // no matter what exit_date says.
  const now      = new Date()
  const nowYear  = now.getFullYear()
  const nowMonth = now.getMonth() + 1
  const beforeCurrentMonth =
    fee.year < nowYear || (fee.year === nowYear && fee.month < nowMonth)
  if (!beforeCurrentMonth) return false

  // Past months: respect an explicit exit_date — hide anything after the
  // month they actually left; otherwise keep the row for history.
  if (m.exit_date) {
    const d = new Date(m.exit_date)
    const exitYear  = d.getFullYear()
    const exitMonth = d.getMonth() + 1
    if (fee.year > exitYear || (fee.year === exitYear && fee.month > exitMonth)) {
      return false
    }
  }

  return true
}
