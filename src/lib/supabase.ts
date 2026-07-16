import { createClient } from '@supabase/supabase-js';

// These should ideally be in a .env file, but injecting them directly as requested
const supabaseUrl = 'https://zjrjcvgnuaooamwsqlvi.supabase.co';
const supabaseAnonKey = 'sb_publishable_o4lGutYYGV-Qc1a9JN_vIA_EGebEYFt';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
