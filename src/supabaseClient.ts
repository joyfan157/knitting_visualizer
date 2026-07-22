import { createClient } from '@supabase/supabase-js'

// Credentials come from .env.local (gitignored). See SUPABASE_SETUP.md.
// The anon key is safe to ship in a client app: Row-Level Security on the
// `swatches` table is what actually protects the data.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True once the Supabase URL + anon key are present in the environment. */
export const isConfigured = Boolean(url && anonKey)

// When unconfigured we still create a client with placeholders so imports don't
// crash; the UI shows a setup screen instead of calling it.
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
)
