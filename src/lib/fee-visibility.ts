/**
 * Determines whether a fee row should be visible, given the member's status.
 *
 *   - Active members: always visible (their unpaid dues are exactly what you
 *     need to chase).
 *   - Exited members: only their PAID fees stay visible, as a record of money
 *     actually collected. Every UNPAID fee for an exited member is hidden —
 *     once someone has left, the system must not keep showing them as owing
 *     money. (Keying off paid-vs-unpaid is deliberate: the "Mark as exited"
 *     dialog defaults exit_date to today, so any exit-date-based rule was
 *     unreliable; paid_amount is not.)
 *
 * NOTE: `member` is the embedded record from a Supabase join
 * (e.g. `hostel_students(status)`). Depending on how PostgREST resolves the
 * relationship it can arrive as a single object OR a one-element array. If it
 * arrives as an array and we read `.status` off the array it is `undefined`,
 * the member looks "active", and every exited member leaks through. We
 * normalise the shape here so callers can't be silently defeated by it.
 *
 * Pass the fee row itself as the second argument — it carries `paid_amount`.
 */
type EmbeddedMember = { status?: string | null }

export function isFeeVisibleForExit(
  member: EmbeddedMember | EmbeddedMember[] | null | undefined,
  fee: { paid_amount?: number | string | null }
): boolean {
  const m = Array.isArray(member) ? member[0] : member
  if (!m) return true
  if (m.status !== 'exited') return true

  // Exited member: keep the row only if it represents money actually paid.
  return Number(fee.paid_amount ?? 0) > 0
}
