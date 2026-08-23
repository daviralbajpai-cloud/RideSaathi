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

    let { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const { data: pubProf } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (pubProf) profile = pubProf;
    }

    let rpcIsAdmin = false;
    try {
      const { data: rpcData } = await supabase.rpc('is_admin_user');
      if (rpcData === true || rpcData === 1 || rpcData === 'true') {
        rpcIsAdmin = true;
      }
    } catch (e) {
      // ignore
    }

    const isAdmin = Boolean(
      rpcIsAdmin ||
      profile?.is_admin === true ||
      profile?.is_admin === 'true' ||
      profile?.is_admin === 'TRUE' ||
      profile?.is_admin === 't' ||
      profile?.is_admin === 1 ||
      user.app_metadata?.is_admin === true ||
      user.user_metadata?.is_admin === true ||
      user.app_metadata?.role === 'admin' ||
      user.user_metadata?.role === 'admin' ||
      user.email?.toLowerCase() === 'daviralbajpai@gmail.com'
    );

    if (!isAdmin) {
      return { data: null, error: new Error('Access Denied: Admin authorization required') };
    }

    // 2. Fetch User Statistics (with public_profiles fallback)
    let users = [];
    try {
      const { data: pData, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!pErr && pData && pData.length > 0) {
        users = pData;
      } else {
        const { data: pubData } = await supabase
          .from('public_profiles')
          .select('*');
        if (pubData) {
          users = pubData;
        }
      }
    } catch (e) {
      console.warn('Could not fetch profiles, trying public_profiles:', e);
    }

    // 3. Fetch Ride Statistics
    let ridesData = [];
    try {
      const { data: rData, error: rErr } = await supabase
        .from('rides')
        .select('*')
        .order('created_at', { ascending: false });
      if (!rErr && rData) {
        ridesData = rData;
      }
    } catch (e) {
      console.warn('Could not fetch rides:', e);
    }

    // 4. Fetch Ride Request Statistics
    let requestsData = [];
    try {
      const { data: reqData, error: reqErr } = await supabase
        .from('ride_requests')
        .select('*, ride:rides (from_location, to_location, ride_date)')
        .order('created_at', { ascending: false });
      if (!reqErr && reqData) {
        requestsData = reqData;
      }
    } catch (e) {
      console.warn('Could not fetch requests:', e);
    }

    const userMap = new Map(users.map(u => [u.id, u]));

    const rides = ridesData.map(r => ({
      ...r,
      offered_by_profile: userMap.get(r.offered_by) || { name: 'RideSaathi User', phone: '' }
    }));

    const requests = requestsData.map(req => ({
      ...req,
      requester: userMap.get(req.requested_by) || { name: 'RideSaathi User', phone: '' }
    }));

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
