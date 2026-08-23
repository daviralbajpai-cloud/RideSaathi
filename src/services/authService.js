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

    const trimmedEmail = (email || '').trim();

    // 1. Authenticate credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password
    });

    if (authError || !authData.user) {
      return { data: null, error: authError || new Error('Authentication failed') };
    }

    // 2. Security Check: Query profiles table
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    // Fallback: Check public_profiles if profiles query was restricted by RLS
    if (!profile) {
      const { data: pubProfile } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (pubProfile) {
        profile = pubProfile;
      }
    }

    // RPC check as SECURITY DEFINER
    let rpcIsAdmin = false;
    try {
      const { data: rpcData } = await supabase.rpc('is_admin_user');
      if (rpcData === true || rpcData === 1 || rpcData === 'true') {
        rpcIsAdmin = true;
      }
    } catch (e) {
      // ignore
    }

    // Check admin flag across all possible types and metadata sources
    const isUserAdmin = Boolean(
      rpcIsAdmin ||
      profile?.is_admin === true ||
      profile?.is_admin === 'true' ||
      profile?.is_admin === 'TRUE' ||
      profile?.is_admin === 't' ||
      profile?.is_admin === 1 ||
      authData.user.app_metadata?.is_admin === true ||
      authData.user.user_metadata?.is_admin === true ||
      authData.user.app_metadata?.role === 'admin' ||
      authData.user.user_metadata?.role === 'admin' ||
      trimmedEmail.toLowerCase() === 'daviralbajpai@gmail.com'
    );

    if (!isUserAdmin) {
      // Security Enforcement: Immediately sign out non-admin user attempting admin login
      await supabase.auth.signOut();
      return {
        data: null,
        error: new Error('Access Denied: Account does not have administrative permissions.')
      };
    }

    const finalProfile = {
      id: authData.user.id,
      name: profile?.name || authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || 'Admin User',
      phone: profile?.phone || authData.user.user_metadata?.phone || '',
      photo_url: profile?.photo_url || authData.user.user_metadata?.avatar_url || '',
      is_admin: true,
      ...profile
    };
    finalProfile.is_admin = true;

    return { data: { user: authData.user, profile: finalProfile }, error: null };
  },

  // Fetch current user's profile
  getProfile: async (userId) => {
    if (!isSupabaseConfigured() || !userId) return { data: null, error: null };

    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!data) {
      const { data: pubData } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (pubData) data = pubData;
    }

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
