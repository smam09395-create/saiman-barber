import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from Vite environment variables in production, with safe fallback to user's configured project
const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  'https://tqtmomrhmuuhhriximea.supabase.co';

const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_TGS1FcQD00Rb274K06HAWw_nqehkwHi';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
