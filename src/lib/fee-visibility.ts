/**
 * Determines whether a fee row should be visible for a given period
 * given the member's status. The rule:
 *
 *   - Active members: always visible.
 *   - Exited members with NO exit_date set (legacy data): visible (defensive).
 *   - Exited members with an exit_date: visible only if the fee's
 *     (year, month) is at or before the exit (year, month). Fees from
 *     months strictly after the exit month are hidden.
 *
 * Example: a student exited 2026-05-12.
 *   April 2026 fee  -> visible (was here)
 *   May 2026 fee    -> visible (was here for part of month)
 *   June 2026 fee   -> hidden  (no longer here)
 */
export function isFeeVisibleForExit(
  member: { status?: string | null; exit_date?: string | null } | null | undefined,
  fee: { year: number; month: number }
): boolean {
  if (!member) return true
  if (member.status !== 'exited' || !member.exit_date) return true
  const d = new Date(member.exit_date)
  const exitYear  = d.getFullYear()
  const exitMonth = d.getMonth() + 1
  if (fee.year < exitYear) return true
  if (fee.year === exitYear && fee.month <= exitMonth) return true
  return false
}
