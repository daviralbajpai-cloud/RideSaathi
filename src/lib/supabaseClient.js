import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://mecvvfuzmxwvhlvuibgr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_nZ-0k_5vWhOhHjDZL9f-Vw_2VBC_6aF';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseUrl = (typeof rawUrl === 'string' && rawUrl.trim() !== '' && !rawUrl.includes('your-supabase-project'))
  ? rawUrl.trim()
  : DEFAULT_SUPABASE_URL;

export const supabaseAnonKey = (typeof rawKey === 'string' && rawKey.trim() !== '' && !rawKey.includes('your-supabase-anon-key'))
  ? rawKey.trim()
  : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim() !== '' &&
    !supabaseUrl.includes('your-supabase-project') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim() !== '' &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
