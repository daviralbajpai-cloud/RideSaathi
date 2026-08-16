import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const rideService = {
  // Create a new ride offer
  createRide: async (rideData) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase credentials are not configured in .env') };
    }

    // Retrieve active authenticated user from Supabase session to ensure auth.uid() === offered_by
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      console.error('RideSaathi Auth Error: No authenticated Supabase session found.', authError);
      return { data: null, error: authError || new Error('You must be signed in to offer a ride.') };
    }

    const payload = {
      offered_by: authUser.id,
      from_location: rideData.from,
      to_location: rideData.to,
      ride_date: rideData.date,
      departure_time: rideData.departureTime,
      available_seats: Number(rideData.availableSeats),
      note: rideData.note || '',
      preferences: rideData.preferences || [],
      status: 'active'
    };

    console.log('Sending INSERT to public.rides:', payload);

    const { data, error } = await supabase
      .from('rides')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Supabase INSERT into public.rides failed:', error);
    } else {
      console.log('Successfully inserted ride into public.rides:', data);
    }

    return { data, error };
  },

  // Search active rides matching location, date, and seats capacity
  searchRides: async ({ from, to, date, totalSeats }) => {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: authUserData } = await supabase.auth.getUser();
    console.log('AUTH USER:', authUserData?.user?.id);
    console.log({
      fromLocation: from,
      toLocation: to,
      rideDate: date,
      seatsNeeded: totalSeats
    });

    let query = supabase
      .from('rides')
      .select('*')
      .eq('status', 'active')
      .gte('available_seats', Number(totalSeats) || 1);

    if (date && date.trim()) {
      query = query.gte('ride_date', date.trim());
    }
    if (from && from.trim()) {
      query = query.ilike('from_location', `%${from.trim()}%`);
    }
    if (to && to.trim()) {
      query = query.ilike('to_location', `%${to.trim()}%`);
    }

    let { data: rides, error } = await query.order('created_at', { ascending: false });

    if (error || !rides) {
      console.error('RIDE SELECT ERROR:', error);
      return { data: null, error };
    }

    // Collect unique offered_by UUIDs
    const offererIds = [...new Set(rides.map(r => r.offered_by).filter(Boolean))];

    // Fetch public profile information (id, name, photo_url)
    let publicProfiles = [];
    if (offererIds.length > 0) {
      const { data: profs } = await supabase
        .from('public_profiles')
        .select('id, name, photo_url')
        .in('id', offererIds);
      publicProfiles = profs || [];
    }

    // Merge public profile into each ride as offered_by_profile
    const mergedRides = rides.map(ride => {
      const profile = publicProfiles.find(p => p.id === ride.offered_by);
      return {
        ...ride,
        offered_by_profile: profile ? { id: profile.id, name: profile.name, photo_url: profile.photo_url } : null
      };
    });

    console.log('RIDES:', mergedRides);
    return { data: mergedRides, error: null };
  },

  // Get specific ride details by ID
  getRideDetails: async (rideId) => {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: ride, error } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (error || !ride) return { data: null, error };

    const { data: profile } = await supabase
      .from('public_profiles')
      .select('id, name, photo_url')
      .eq('id', ride.offered_by)
      .maybeSingle();

    return {
      data: {
        ...ride,
        offered_by_profile: profile ? { id: profile.id, name: profile.name, photo_url: profile.photo_url } : null
      },
      error: null
    };
  },

  // Send a booking request
  sendRideRequest: async ({ rideId, requestedBy, seatsRequested }) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase credentials are not configured in .env') };
    }

    // Retrieve active authenticated user from Supabase session to ensure auth.uid() === requested_by
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      console.error('RideSaathi Auth Error: No authenticated Supabase session found for ride request.', authError);
      return { data: null, error: authError || new Error('You must be signed in to request a ride.') };
    }

    if (!rideId) {
      console.error('RideSaathi Error: Missing rideId for ride request.');
      return { data: null, error: new Error('Invalid ride selected.') };
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rideId);
    if (!isUuid) {
      console.error('RideSaathi Error: Invalid ride_id syntax. Must be a real Supabase database UUID, received:', rideId);
      return {
        data: null,
        error: new Error(`Invalid ride ID "${rideId}". Please select a real ride offer from live listings.`)
      };
    }

    const payload = {
      ride_id: rideId,
      requested_by: authUser.id,
      seats_requested: Number(seatsRequested) || 1,
      status: 'pending'
    };

    console.log("Ride request payload:", {
      ride_id: payload.ride_id,
      requested_by: payload.requested_by,
      seats_requested: payload.seats_requested
    });

    const { data, error } = await supabase
      .from('ride_requests')
      .insert(payload)
      .select()
      .single();

    // Fetch target ride details to identify the ride offerer (Account A)
    const { data: targetRide, error: rideError } = await supabase
      .from('rides')
      .select('id, offered_by, from_location, to_location')
      .eq('id', rideId)
      .single();

    console.log("=== RIDE REQUEST CREATED ===");
    console.log("REQUEST DATA:", data);
    console.log("REQUEST ERROR:", error);
    console.log("AUTH USER:", authUser?.id);
    console.log("TARGET RIDE:", targetRide);
    console.log("TARGET RIDE ERROR:", rideError);
    console.log("TARGET RIDE OFFERER:", targetRide?.offered_by);

    if (error) {
      console.error('Supabase INSERT into public.ride_requests failed:', error);
    } else {
      const fromLoc = targetRide?.from_location || 'origin';
      const toLoc = targetRide?.to_location || 'destination';

      // NOTIFICATION 1: For Requester (Account B)
      const { data: requesterNotification, error: requesterNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: authUser.id,
          title: 'Ride Request Sent',
          message: `Your request to join the ride from ${fromLoc} to ${toLoc} was sent.`,
          type: 'info',
          is_read: false
        });

      console.log("REQUESTER NOTIFICATION RESULT:", requesterNotification);
      console.log("REQUESTER NOTIFICATION ERROR:", requesterNotificationError);

      // NOTIFICATION 2: For Ride Offerer (Account A)
      if (targetRide && targetRide.offered_by && targetRide.offered_by !== authUser.id) {
        const { data: offererNotification, error: offererNotificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: targetRide.offered_by,
            title: 'New Ride Request',
            message: `A person has requested to join your ride from ${fromLoc} to ${toLoc}.`,
            type: 'request',
            is_read: false
          });

        console.log("OFFERER NOTIFICATION RESULT:", offererNotification);
        console.log("OFFERER NOTIFICATION ERROR:", offererNotificationError);
      }
    }

    return { data, error };
  },

  // Securely accept ride request using PostgreSQL RPC function or direct fallback update
  acceptRideRequest: async (requestId, offeredByUserId) => {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const currentUserId = offeredByUserId || user?.id;

    console.log("ACCEPT CLICK REQUEST ID:", requestId);
    console.log("ACCEPT CURRENT USER:", user?.id);
    console.log("ACCEPT AUTH ERROR:", authError);

    // Step 1: Pre-check request row directly from public.ride_requests
    const { data: pendingRequest, error: pendingError } = await supabase
      .from('ride_requests')
      .select('*, ride:rides(*)')
      .eq('id', requestId)
      .maybeSingle();

    console.log("PENDING REQUEST BEFORE ACCEPT:", pendingRequest);
    console.log("PENDING REQUEST ERROR:", pendingError);

    console.log({
      requestId,
      requestIdType: typeof requestId,
      rideId: pendingRequest?.ride_id,
      currentUserId: user?.id
    });

    if (!pendingRequest) {
      console.error("ACCEPT ERROR: Request row not found for ID:", requestId);
      return { data: { success: false, message: "Pending request not found" }, error: pendingError };
    }

    // Step 2: Attempt PostgreSQL RPC call
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('accept_ride_request', {
      p_request_id: requestId,
      p_offered_by: currentUserId
    });

    console.log("ACCEPT RPC RESULT:", rpcRes);
    console.log("ACCEPT RPC ERROR:", rpcErr);

    if (!rpcErr && rpcRes && rpcRes.success) {
      return { data: rpcRes, error: null };
    }

    // Step 3: Direct fallback update if RPC returned error or 'not found'
    console.warn("Executing direct update fallback for accept_ride_request...");

    const { data: updatedReq, error: updateReqErr } = await supabase
      .from('ride_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (updateReqErr) {
      console.error("Direct request update error:", updateReqErr);
      return { data: { success: false, message: updateReqErr.message }, error: updateReqErr };
    }

    // Decrement available seats on target ride
    const targetRideId = pendingRequest.ride_id || pendingRequest.ride?.id;
    if (targetRideId) {
      const currentAvailable = pendingRequest.ride?.available_seats ?? 1;
      const seatsReq = pendingRequest.seats_requested || 1;
      const newAvailable = Math.max(0, currentAvailable - seatsReq);

      await supabase
        .from('rides')
        .update({ available_seats: newAvailable })
        .eq('id', targetRideId);
    }

    // Insert success notification for requester
    if (pendingRequest.requested_by) {
      const fromLoc = pendingRequest.ride?.from_location || 'origin';
      const toLoc = pendingRequest.ride?.to_location || 'destination';

      await supabase
        .from('notifications')
        .insert({
          user_id: pendingRequest.requested_by,
          title: 'Ride Request Accepted',
          message: `Your request to join the ride from ${fromLoc} to ${toLoc} was accepted!`,
          type: 'success'
        });
    }

    return { data: { success: true, message: "Ride request accepted successfully" }, error: null };
  },

  // Decline a ride request
  declineRideRequest: async (requestId) => {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user: authUser } } = await supabase.auth.getUser();
    const currentUserId = authUser?.id;

    console.log("DECLINE REQUEST ID:", requestId);
    console.log("CURRENT USER ID:", currentUserId);

    if (!requestId || !currentUserId) {
      console.error("DECLINE ERROR: Missing requestId or currentUserId", { requestId, currentUserId });
      return { data: null, error: new Error("Invalid request or unauthenticated user") };
    }

    const { data, error } = await supabase
      .from('ride_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    console.log("DECLINE RESULT:", data);
    if (error) console.error("DECLINE ERROR:", error);

    // Create decline notification for the requester (Account B)
    if (data && data.requested_by) {
      const { data: targetRide } = await supabase
        .from('rides')
        .select('from_location, to_location')
        .eq('id', data.ride_id)
        .maybeSingle();

      const fromLoc = targetRide?.from_location || 'origin';
      const toLoc = targetRide?.to_location || 'destination';

      await supabase
        .from('notifications')
        .insert({
          user_id: data.requested_by,
          title: 'Ride Request Declined',
          message: `Your request to join the ride from ${fromLoc} to ${toLoc} was declined.`,
          type: 'warning',
          is_read: false
        });
    }

    return { data, error };
  },

  // Fetch activity journeys categorized into tabs
  getUserActivity: async (userId) => {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    // 1. Authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("========== ACCOUNT A AUTH ==========");
    console.log("USER:", user);
    console.log("USER UUID:", user?.id);
    console.log("AUTH ERROR:", authError);

    const currentUserId = user?.id || userId;
    if (!currentUserId) return { data: null, error: new Error('Unauthenticated') };

    // 2. Simple query 1: Fetch rides as Account A
    const { data: rides, error: ridesError } = await supabase
      .from('rides')
      .select('*');

    console.log("========== RIDES AS ACCOUNT A ==========");
    console.log("RIDES:", JSON.stringify(rides, null, 2));
    console.log("RIDES ERROR:", ridesError);

    // 3. Simple query 2: Fetch ride_requests as Account A
    const { data: requests, error: requestsError } = await supabase
      .from('ride_requests')
      .select('*');

    console.log("========== REQUESTS AS ACCOUNT A ==========");
    console.log("REQUESTS:", JSON.stringify(requests, null, 2));
    console.log("REQUEST ERROR:", requestsError);

    // 4. Fetch public profiles for requester names
    const { data: profiles } = await supabase
      .from('public_profiles')
      .select('id, name, photo_url');

    // 5. Match requests to rides in JS (no nested query join)
    const receivedRequestsRaw = [];
    const myRequestsRaw = [];

    (requests || []).forEach(request => {
      const matchedRide = (rides || []).find(ride => ride.id === request.ride_id);
      const isIncomingRequest = matchedRide?.offered_by === currentUserId && request.requested_by !== currentUserId;

      console.log({
        requestId: request.id,
        requestRideId: request.ride_id,
        requestedBy: request.requested_by,
        matchedRideId: matchedRide?.id,
        offeredBy: matchedRide?.offered_by,
        currentUserId: currentUserId,
        isIncomingRequest: isIncomingRequest
      });

      if (isIncomingRequest) {
        receivedRequestsRaw.push({ ...request, ride: matchedRide });
      } else if (request.requested_by === currentUserId) {
        myRequestsRaw.push({ ...request, ride: matchedRide });
      }
    });

    const offeredRides = (rides || [])
      .filter(r => r.offered_by === currentUserId)
      .map(r => ({
        id: r.id,
        personOffering: 'You',
        personPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        from: r.from_location,
        to: r.to_location,
        date: r.ride_date,
        time: r.departure_time,
        availableSeats: r.available_seats,
        status: r.status === 'active' ? 'Active Offer' : r.status
      }));

    const requestsTabItems = receivedRequestsRaw.map(req => {
      const requester = (profiles || []).find(p => p.id === req.requested_by);
      let displayStatus = 'Pending Confirmation';
      if (req.status === 'accepted') displayStatus = 'Accepted';
      if (req.status === 'declined') displayStatus = 'Declined';

      return {
        id: req.id,
        rideId: req.ride_id,
        personRequesting: requester?.name || 'Commuter',
        personPhoto: requester?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        from: req.ride?.from_location || '',
        to: req.ride?.to_location || '',
        date: req.ride?.ride_date || '',
        time: req.ride?.departure_time || '',
        seatsRequested: req.seats_requested,
        status: displayStatus
      };
    });

    const upcomingTabItems = myRequestsRaw.map(req => {
      let displayStatus = 'Pending Confirmation';
      if (req.status === 'accepted') displayStatus = 'Accepted';
      if (req.status === 'declined') displayStatus = 'Declined';

      return {
        id: req.id,
        rideId: req.ride_id,
        personOffering: 'Person offering ride',
        personPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        from: req.ride?.from_location || '',
        to: req.ride?.to_location || '',
        date: req.ride?.ride_date || '',
        time: req.ride?.departure_time || '',
        seatsRequested: req.seats_requested,
        status: displayStatus
      };
    });

    console.log("ACTIVITY RAW REQUEST DATA:", JSON.stringify(requests, null, 2));
    console.log("ACTIVITY FINAL REQUEST DATA:", JSON.stringify(requestsTabItems, null, 2));

    return {
      data: {
        offered: offeredRides,
        requests: requestsTabItems,
        upcoming: upcomingTabItems,
        completed: [],
        cancelled: []
      },
      error: ridesError || requestsError
    };
  },

  // Create recurring ride schedule
  createRecurringRide: async (recurringData) => {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from('recurring_rides')
      .insert({
        offered_by: recurringData.offeredBy,
        from_location: recurringData.from,
        to_location: recurringData.to,
        departure_time: recurringData.departureTime,
        available_seats: recurringData.availableSeats,
        repeat_days: recurringData.repeatDays,
        status: 'active'
      })
      .select()
      .single();

    return { data, error };
  },

  // Get recurring rides
  getUserRecurringRides: async (userId) => {
    if (!isSupabaseConfigured() || !userId) return { data: [], error: null };

    const { data, error } = await supabase
      .from('recurring_rides')
      .select('*')
      .eq('offered_by', userId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  }
};
