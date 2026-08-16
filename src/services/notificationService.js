import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const notificationService = {
  getUserNotifications: async (userId) => {
    if (!isSupabaseConfigured() || !userId) return { data: [], error: null };

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  markAsRead: async (notificationId) => {
    if (!isSupabaseConfigured() || !notificationId) return { data: null, error: null };

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    return { data, error };
  },

  // Subscribe to realtime notification updates for active user
  subscribeToNotifications: (userId, callback) => {
    if (!isSupabaseConfigured() || !userId || !supabase) return () => {};

    const channel = supabase
      .channel(`public:notifications:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (callback && payload.new) {
            callback(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
