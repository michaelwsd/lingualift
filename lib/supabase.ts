import { createClient } from '@supabase/supabase-js';

// Server-side client using service role key (bypasses RLS)
// Used in API routes where Clerk handles authentication
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * True when a query failed only because the `due_date` column doesn't exist yet
 * (migration 001 not applied). Lets routes retry without due_date so the app
 * keeps working before/after the migration is run.
 */
export function isMissingDueDateColumn(error: { code?: string; message?: string; details?: string } | null): boolean {
  if (!error) return false;
  const blob = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  return error.code === '42703' || error.code === 'PGRST204' || (blob.includes('due_date') && blob.includes('column'));
}

/** True when a query failed because an optional column (e.g. due_date / unlock_date) doesn't exist yet. */
export function isMissingColumnError(error: { code?: string; message?: string; details?: string } | null): boolean {
  if (!error) return false;
  const blob = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  return error.code === '42703' || error.code === 'PGRST204' || blob.includes('does not exist') || (blob.includes('column') && blob.includes('unlock_date'));
}
