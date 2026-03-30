// ═══════════════════════════════════════
//  iBilib — Supabase Client Singleton
//  src/lib/supabase.ts
// ═══════════════════════════════════════

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yapnbwxerwppsepcdcxi.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhcG5id3hlcndwcHNlcGNkY3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjY2NDIsImV4cCI6MjA4ODEwMjY0Mn0.ROjaZEjyQ22-GHEussOo1Sr7VCAhoWnjO-42NCWtrxk';

/**
 * Singleton Supabase client shared across the entire application.
 * Import this instead of calling createClient in each module.
 *
 * @example
 * import { sb } from '@/lib/supabase';
 * const { data, error } = await sb.from('profiles').select('*');
 */
export const sb: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON);
