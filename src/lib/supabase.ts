import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dukdfodkgsztxwisfajt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hy5l7RlMbv7Ai5W3xSfXkA_tr7czkuj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
