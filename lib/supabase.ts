import { createClient } from '@supabase/supabase-js';

// Server-side client using service role key (bypasses RLS)
// Used in API routes where Clerk handles authentication
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
