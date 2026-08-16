import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const authService = {
  // Option 1: Continue with Google OAuth for normal users
  signInWithGoogle: async () => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase credentials not configured in .env') };
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/home'
      }
    });
    return { data, error };
  },

  // Option 2: Dedicated Admin Login using Email + Password
  signInWithAdminPassword: async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase credentials not configured in .env') };
    }

    // 1. Authenticate credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return { data: null, error: authError || new Error('Authentication failed') };
    }

    // 2. Security Check: Verify `is_admin = TRUE` in database profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile || !profile.is_admin) {
      // Security Enforcement: Immediately sign out non-admin user attempting admin login
      await supabase.auth.signOut();
      return {
        data: null,
        error: new Error('Access Denied: Account does not have administrative permissions.')
      };
    }

    return { data: { user: authData.user, profile }, error: null };
  },

  // Fetch current user's profile
  getProfile: async (userId) => {
    if (!isSupabaseConfigured() || !userId) return { data: null, error: null };

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  },

  // Save / Update profile details (Name, Phone, Photo URL)
  updateProfile: async (userId, { name, phone, photo_url }) => {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name,
        phone,
        photo_url,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    return { data, error };
  },

  // Sign out user
  signOut: async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
  }
};
