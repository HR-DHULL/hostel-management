'use server'

import { revalidatePath } from 'next/cache'
import { createClient, requireRole } from '@/lib/supabase/server'
import type { AssetCategory, AssetStatus } from '@/lib/queries/assets'

// ----------------------------------------------------------------------
// Shared types
// ----------------------------------------------------------------------

export interface AssignmentInput {
  /** Either profile_id (existing team member) OR name (new joiner / contractor) */
  assigned_to_profile_id?: string | null
  assigned_to_name?:       string | null
  assigned_to_phone?:      string | null
  assignment_notes?:       string | null
}

export interface AssetCreateInput {
  expense_id?:     string | null
  name:            string
  category:        AssetCategory
  serial_number?:  string | null
  purchase_amount?: number | null
  purchase_date?:  string | null
  notes?:          string | null
  /** Optional: assign immediately on creation */
  assignment?:     AssignmentInput
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function validateRecipient(a: AssignmentInput) {
  const hasProfile = !!a.assigned_to_profile_id
  const hasName    = !!(a.assigned_to_name && a.assigned_to_name.trim())
  if (!hasProfile && !hasName) {
    throw new Error('Assignment requires either an existing team member or a name')
  }
}

// ----------------------------------------------------------------------
// CREATE asset (with optional initial assignment)
// ----------------------------------------------------------------------

export async function createAsset(input: AssetCreateInput) {
  await requireRole('owner', 'staff')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: asset, error } = await (supabase.from('assets') as any)
    .insert({
      expense_id:      input.expense_id ?? null,
      name:            input.name,
      category:        input.category,
      serial_number:   input.serial_number ?? null,
      purchase_amount: input.purchase_amount ?? null,
      purchase_date:   input.purchase_date ?? null,
      notes:           input.notes ?? null,
      created_by:      user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  const assetId = asset.id as string

  if (input.assignment) {
    validateRecipient(input.assignment)
    const { error: assignErr } = await (supabase.from('asset_assignments') as any).insert({
      asset_id:               assetId,
      assigned_to_profile_id: input.assignment.assigned_to_profile_id ?? null,
      assigned_to_name:       input.assignment.assigned_to_name?.trim() || null,
      assigned_to_phone:      input.assignment.assigned_to_phone?.trim() || null,
      assignment_notes:       input.assignment.assignment_notes?.trim() || null,
      created_by:             user?.id ?? null,
    })
    if (assignErr) {
      // Roll back the asset row so we don't leave an orphan
      await (supabase.from('assets') as any).delete().eq('id', assetId)
      throw new Error(assignErr.message)
    }
  } else {
    // No initial holder = goes straight to storage
    await (supabase.from('assets') as any)
      .update({ status: 'in_storage' as AssetStatus })
      .eq('id', assetId)
  }

  revalidatePath('/assets')
  return assetId
}

// ----------------------------------------------------------------------
// REASSIGN: return current holder, then assign new one
// Sequential (not transactional). On insert failure, asset ends up in
// storage state which is recoverable from the UI.
// ----------------------------------------------------------------------

export async function reassignAsset(assetId: string, next: AssignmentInput) {
  await requireRole('owner', 'staff')
  validateRecipient(next)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Mark current active assignment as returned
  const { error: returnErr } = await (supabase.from('asset_assignments') as any)
    .update({ returned_at: new Date().toISOString() })
    .eq('asset_id', assetId)
    .is('returned_at', null)

  if (returnErr) throw new Error(returnErr.message)

  // 2. Insert the new active assignment
  const { error: insertErr } = await (supabase.from('asset_assignments') as any).insert({
    asset_id:               assetId,
    assigned_to_profile_id: next.assigned_to_profile_id ?? null,
    assigned_to_name:       next.assigned_to_name?.trim() || null,
    assigned_to_phone:      next.assigned_to_phone?.trim() || null,
    assignment_notes:       next.assignment_notes?.trim() || null,
    created_by:             user?.id ?? null,
  })
  if (insertErr) throw new Error(insertErr.message)

  await (supabase.from('assets') as any)
    .update({ status: 'in_use' as AssetStatus })
    .eq('id', assetId)

  revalidatePath('/assets')
}

// ----------------------------------------------------------------------
// RETURN: mark current holder as returned, asset goes to storage
// ----------------------------------------------------------------------

export async function returnAsset(assetId: string) {
  await requireRole('owner', 'staff')
  const supabase = await createClient()

  const { error } = await (supabase.from('asset_assignments') as any)
    .update({ returned_at: new Date().toISOString() })
    .eq('asset_id', assetId)
    .is('returned_at', null)

  if (error) throw new Error(error.message)

  await (supabase.from('assets') as any)
    .update({ status: 'in_storage' as AssetStatus })
    .eq('id', assetId)

  revalidatePath('/assets')
}

// ----------------------------------------------------------------------
// SET STATUS: retire / lost / restore
// ----------------------------------------------------------------------

export async function setAssetStatus(assetId: string, status: AssetStatus) {
  await requireRole('owner', 'staff')
  const supabase = await createClient()

  // If retiring or marking lost, also close any active assignment
  if (status === 'retired' || status === 'lost') {
    await (supabase.from('asset_assignments') as any)
      .update({ returned_at: new Date().toISOString() })
      .eq('asset_id', assetId)
      .is('returned_at', null)
  }

  const { error } = await (supabase.from('assets') as any)
    .update({ status })
    .eq('id', assetId)

  if (error) throw new Error(error.message)
  revalidatePath('/assets')
}

// ----------------------------------------------------------------------
// UPDATE asset metadata (name, serial, notes)
// ----------------------------------------------------------------------

export async function updateAsset(
  assetId: string,
  patch: Partial<Pick<AssetCreateInput, 'name' | 'category' | 'serial_number' | 'notes'>>
) {
  await requireRole('owner', 'staff')
  const supabase = await createClient()

  const { error } = await (supabase.from('assets') as any).update(patch).eq('id', assetId)
  if (error) throw new Error(error.message)

  revalidatePath('/assets')
}

// ----------------------------------------------------------------------
// DELETE asset (owner only — wipes assignment history via CASCADE)
// ----------------------------------------------------------------------

export async function deleteAsset(assetId: string) {
  await requireRole('owner')
  const supabase = await createClient()

  const { error } = await (supabase.from('assets') as any).delete().eq('id', assetId)
  if (error) throw new Error(error.message)

  revalidatePath('/assets')
}
