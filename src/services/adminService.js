import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const adminService = {
  getAdminStats: async () => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase credentials not configured in .env') };
    }

    // 1. Verify caller has admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('Unauthorized: User not authenticated') };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return { data: null, error: new Error('Access Denied: Admin authorization required') };
    }

    // 2. Fetch User Statistics
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // 3. Fetch Ride Statistics
    const { data: ridesData, error: ridesError } = await supabase
      .from('rides')
      .select(`
        *,
        offered_by_profile:profiles!rides_offered_by_fkey (name, phone)
      `)
      .order('created_at', { ascending: false });

    // 4. Fetch Ride Request Statistics
    const { data: requestsData, error: requestsError } = await supabase
      .from('ride_requests')
      .select(`
        *,
        requester:profiles!ride_requests_requested_by_fkey (name, phone),
        ride:rides (from_location, to_location, ride_date)
      `)
      .order('created_at', { ascending: false });

    if (usersError || ridesError || requestsError) {
      return { data: null, error: usersError || ridesError || requestsError };
    }

    const users = usersData || [];
    const rides = ridesData || [];
    const requests = requestsData || [];

    // Calculate aggregated KPIs
    const stats = {
      users: {
        total: users.length,
        newCount: users.filter(u => {
          const diffDays = (new Date() - new Date(u.created_at)) / (1000 * 3600 * 24);
          return diffDays <= 7;
        }).length,
        list: users
      },
      rides: {
        total: rides.length,
        active: rides.filter(r => r.status === 'active').length,
        completed: rides.filter(r => r.status === 'completed').length,
        cancelled: rides.filter(r => r.status === 'cancelled').length,
        list: rides
      },
      requests: {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        accepted: requests.filter(r => r.status === 'accepted').length,
        declined: requests.filter(r => r.status === 'declined').length,
        list: requests
      }
    };

    return { data: stats, error: null };
  }
};
