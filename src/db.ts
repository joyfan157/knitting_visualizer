import { supabase } from './supabaseClient'
import type { Swatch } from './types'
import { normalizeSwatch } from './migrate'

// Storage lives in Supabase (hosted Postgres). One row per gauge swatch; the
// full Swatch object is kept in a `data` jsonb column so the app's shape can
// evolve without migrations. Row-Level Security scopes rows to the signed-in
// user, so these queries only ever see/affect the current user's swatches.

const TABLE = 'swatches'

interface Row {
  id: string
  created_at: string | null
  data: unknown
}

function toRow(s: Swatch): { id: string; created_at: string; data: Swatch } {
  return { id: s.id, created_at: s.createdAt, data: s }
}

/** All swatches, newest first (normalized to the current shape on read). */
export async function getAllSwatches(): Promise<Swatch[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, created_at, data')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data as Row[] | null) ?? []).map((r) => normalizeSwatch(r.data))
}

export async function saveSwatch(swatch: Swatch): Promise<void> {
  const { error } = await supabase.from(TABLE).upsert(toRow(swatch))
  if (error) throw error
}

export async function deleteSwatch(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

/** Bulk upsert, used by JSON import. Normalizes older shapes on the way in. */
export async function importSwatches(swatches: unknown[]): Promise<void> {
  const rows = swatches.map((s) => toRow(normalizeSwatch(s)))
  const { error } = await supabase.from(TABLE).upsert(rows)
  if (error) throw error
}
