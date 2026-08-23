import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { validatePhoneNumber } from '../lib/phoneUtils';
import { isRideExpired, getTodayDateIST } from '../lib/timeUtils';

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

    // Security Check: Verify user has a valid 10-digit phone number in their database profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', authUser.id)
      .maybeSingle();

    const phoneValidation = validatePhoneNumber(profile?.phone);
    if (!phoneValidation.isValid) {
      return {
        data: null,
        error: new Error('A valid 10-digit phone number is required before offering a ride. Please add your phone number in your Profile.')
      };
    }

    const fromLabel = typeof rideData.from === 'object' ? rideData.from.label : rideData.from;
    const toLabel = typeof rideData.to === 'object' ? rideData.to.label : rideData.to;

    const basePayload = {
      offered_by: authUser.id,
      from_location: fromLabel,
      to_location: toLabel,
      ride_date: rideData.date,
      departure_time: rideData.departureTime,
      available_seats: Number(rideData.availableSeats),
      note: rideData.note || '',
      preferences: rideData.preferences || [],
      status: 'active'
    };

    const fullPayload = {
      ...basePayload,
      from_latitude: rideData.fromLatitude ?? (typeof rideData.from === 'object' ? rideData.from.latitude : null),
      from_longitude: rideData.fromLongitude ?? (typeof rideData.from === 'object' ? rideData.from.longitude : null),
      to_latitude: rideData.toLatitude ?? (typeof rideData.to === 'object' ? rideData.to.latitude : null),
      to_longitude: rideData.toLongitude ?? (typeof rideData.to === 'object' ? rideData.to.longitude : null),
      from_place_id: rideData.fromPlaceId ?? (typeof rideData.from === 'object' ? rideData.from.placeId : null),
      to_place_id: rideData.toPlaceId ?? (typeof rideData.to === 'object' ? rideData.to.placeId : null)
    };

    console.log('Sending INSERT to public.rides:', fullPayload);

    let { data, error } = await supabase
      .from('rides')
      .insert(fullPayload)
      .select()
      .single();

    // Fallback: If table does not have latitude/longitude columns yet, insert base payload
    if (error && (error.message?.includes('from_latitude') || error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
      console.warn('Coordinates columns not found in public.rides. Falling back to standard schema payload...');
      const fallbackResult = await supabase
        .from('rides')
        .insert(basePayload)
        .select()
        .single();

      data = fallbackResult.data;
      error = fallbackResult.error;
    }

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

    // Extract core place terms for flexible matching
    const extractSearchTerm = (loc) => {
      if (!loc) return '';
      if (typeof loc === 'object') {
        return loc.name || (loc.label ? loc.label.split(',')[0].trim() : '');
      }
      return typeof loc === 'string' ? loc.split(',')[0].trim() : '';
    };

    const fromTerm = extractSearchTerm(from);
    const toTerm = extractSearchTerm(to);

    console.log({
      fromTerm,
      toTerm,
      rideDate: date,
      seatsNeeded: totalSeats
    });

    let query = supabase
      .from('rides')
      .select('*')
      .eq('status', 'active')
      .gte('available_seats', Number(totalSeats) || 1);

    if (date && typeof date === 'string' && date.trim()) {
      query = query.gte('ride_date', date.trim());
    } else {
      const todayIST = getTodayDateIST();
      query = query.gte('ride_date', todayIST);
    }

    if (fromTerm) {
      query = query.ilike('from_location', `%${fromTerm}%`);
    }
    if (toTerm) {
      query = query.ilike('to_location', `%${toTerm}%`);
    }

    let { data: rides, error } = await query.order('created_at', { ascending: false });

    if (error || !rides) {
      console.error('RIDE SELECT ERROR:', error);
      return { data: null, error };
    }

    // Defense-in-depth: Filter out any rides whose departure time has passed
    const unexpiredRides = rides.filter(ride => !isRideExpired(ride.ride_date, ride.departure_time));

    // Collect unique offered_by UUIDs
    const offererIds = [...new Set(unexpiredRides.map(r => r.offered_by).filter(Boolean))];

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
    const mergedRides = unexpiredRides.map(ride => {
      const profile = publicProfiles.find(p => p.id === ride.offered_by);
      return {
        ...ride,
        offered_by_profile: profile ? { id: profile.id, name: profile.name, photo_url: profile.photo_url } : null
      };
    });

    console.log('ACTIVE UNEXPIRED RIDES:', mergedRides);
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

  // Send a booking request via RPC function
  sendRideRequest: async ({ rideId, requestedBy, seatsRequested }) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase credentials are not configured in .env') };
    }

    if (!rideId) {
      console.error('RideSaathi Error: Missing rideId for ride request.');
      return { data: null, error: new Error('Invalid ride selected.') };
    }

    // Security Check: Verify user is not requesting their own ride
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: rideCheck } = await supabase
        .from('rides')
        .select('offered_by')
        .eq('id', rideId)
        .maybeSingle();

      if (rideCheck && rideCheck.offered_by === authUser.id) {
        return {
          data: null,
          error: new Error('You cannot request or book a ride that you offered.')
        };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', authUser.id)
        .maybeSingle();

      const phoneValidation = validatePhoneNumber(profile?.phone);
      if (!phoneValidation.isValid) {
        return {
          data: null,
          error: new Error('A valid 10-digit phone number is required before requesting a ride. Please add your phone number in your Profile.')
        };
      }
    }

    const { data: rpcRes, error: rpcErr } = await supabase.rpc('send_ride_request', {
      p_ride_id: rideId,
      p_seats_requested: Number(seatsRequested) || 1
    });

    console.log("SEND RIDE REQUEST RPC RESULT:", rpcRes);
    console.log("SEND RIDE REQUEST RPC ERROR:", rpcErr);

    if (rpcErr) {
      return { data: null, error: rpcErr };
    }

    if (rpcRes && !rpcRes.success) {
      return { data: null, error: new Error(rpcRes.message || 'Failed to send ride request') };
    }

    return { data: rpcRes, error: null };
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

  // Decline a ride request via RPC function
  declineRideRequest: async (requestId) => {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    console.log("DECLINE REQUEST ID:", requestId);

    if (!requestId) {
      console.error("DECLINE ERROR: Missing requestId", { requestId });
      return { data: null, error: new Error("Invalid request ID") };
    }

    const { data: rpcRes, error: rpcErr } = await supabase.rpc('decline_ride_request', {
      p_request_id: requestId
    });

    console.log("DECLINE RIDE REQUEST RPC RESULT:", rpcRes);
    console.log("DECLINE RIDE REQUEST RPC ERROR:", rpcErr);

    if (rpcErr) {
      return { data: null, error: rpcErr };
    }

    if (rpcRes && !rpcRes.success) {
      return { data: null, error: new Error(rpcRes.message || 'Failed to decline ride request') };
    }

    return { data: rpcRes, error: null };
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

    // 4. Collect all participant IDs for names and photos
    const allParticipantIds = new Set();
    const acceptedOtherParticipantIds = new Set();

    (requests || []).forEach(request => {
      if (request.requested_by) allParticipantIds.add(request.requested_by);
      const matchedRide = (rides || []).find(ride => ride.id === request.ride_id);
      if (matchedRide?.offered_by) allParticipantIds.add(matchedRide.offered_by);

      // Privacy Check: Only collect target participant ID if request is ACCEPTED
      if (request.status === 'accepted' && matchedRide) {
        if (matchedRide.offered_by === currentUserId && request.requested_by !== currentUserId) {
          // Offerer needs requester's phone
          acceptedOtherParticipantIds.add(request.requested_by);
        } else if (request.requested_by === currentUserId) {
          // Requester needs offerer's phone
          acceptedOtherParticipantIds.add(matchedRide.offered_by);
        }
      }
    });

    // 5. Fetch public profile information (names & photos)
    let profiles = [];
    if (allParticipantIds.size > 0) {
      const { data: pubProfs } = await supabase
        .from('public_profiles')
        .select('id, name, photo_url')
        .in('id', Array.from(allParticipantIds));

      if (pubProfs && pubProfs.length > 0) {
        profiles = pubProfs;
      } else {
        const { data: directProfs } = await supabase
          .from('profiles')
          .select('id, name, photo_url')
          .in('id', Array.from(allParticipantIds));
        if (directProfs) profiles = directProfs;
      }
    }

    // 6. Fetch phone numbers ONLY for participants in ACCEPTED requests via secure RPC
    const acceptedPhoneMap = new Map();
    try {
      const { data: contacts, error: contactErr } = await supabase
        .rpc('get_accepted_ride_contacts');

      if (!contactErr && contacts && contacts.length > 0) {
        contacts.forEach(c => {
          if (c.participant_phone && c.participant_phone.trim() !== '') {
            acceptedPhoneMap.set(c.participant_id, c.participant_phone.trim());
          }
        });
      } else if (acceptedOtherParticipantIds.size > 0) {
        // Fallback query for accepted participants
        const { data: phoneData } = await supabase
          .from('profiles')
          .select('id, phone')
          .in('id', Array.from(acceptedOtherParticipantIds));

        if (phoneData) {
          phoneData.forEach(p => {
            if (p.phone && p.phone.trim() !== '') {
              acceptedPhoneMap.set(p.id, p.phone.trim());
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error fetching accepted contacts:', e);
    }

    // 7. Match requests to rides in JS
    const receivedRequestsRaw = [];
    const myRequestsRaw = [];

    (requests || []).forEach(request => {
      const matchedRide = (rides || []).find(ride => ride.id === request.ride_id);
      const isIncomingRequest = matchedRide?.offered_by === currentUserId && request.requested_by !== currentUserId;

      if (isIncomingRequest) {
        receivedRequestsRaw.push({ ...request, ride: matchedRide });
      } else if (request.requested_by === currentUserId) {
        myRequestsRaw.push({ ...request, ride: matchedRide });
      }
    });

    const offeredRides = [];
    const completedRides = [];
    const cancelledRides = [];

    (rides || [])
      .filter(r => r.offered_by === currentUserId)
      .forEach(r => {
        const isExpired = isRideExpired(r.ride_date, r.departure_time);
        const item = {
          id: r.id,
          personOffering: 'You',
          personPhoto: user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          from: r.from_location,
          to: r.to_location,
          date: r.ride_date,
          time: r.departure_time,
          availableSeats: r.available_seats,
          status: r.status === 'active' ? 'Active Offer' : (r.status === 'completed' ? 'Completed' : (r.status === 'cancelled' ? 'Cancelled' : r.status))
        };

        if (r.status === 'completed') {
          completedRides.push(item);
        } else if (r.status === 'cancelled') {
          cancelledRides.push(item);
        } else {
          // Status is active: check if ride date/time has passed
          if (isExpired) {
            completedRides.push({
              ...item,
              status: 'Completed'
            });
          } else {
            offeredRides.push(item);
          }
        }
      });

    const requestsTabItems = [];
    receivedRequestsRaw.forEach(req => {
      const requester = profiles.find(p => p.id === req.requested_by);
      let displayStatus = 'Pending Confirmation';
      if (req.status === 'accepted') displayStatus = 'Accepted';
      if (req.status === 'declined') displayStatus = 'Declined';
      if (req.status === 'cancelled') displayStatus = 'Cancelled';

      // Attach phone only when accepted
      const isAccepted = req.status === 'accepted';
      const personPhone = isAccepted ? (acceptedPhoneMap.get(req.requested_by) || '') : null;
      const isExpired = isRideExpired(req.ride?.ride_date, req.ride?.departure_time);

      const item = {
        id: req.id,
        rideId: req.ride_id,
        personRequesting: requester?.name || 'Commuter',
        personPhoto: requester?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        personPhone: personPhone,
        from: req.ride?.from_location || '',
        to: req.ride?.to_location || '',
        date: req.ride?.ride_date || '',
        time: req.ride?.departure_time || '',
        seatsRequested: req.seats_requested,
        status: displayStatus
      };

      if (req.status === 'declined' || req.status === 'cancelled') {
        cancelledRides.push(item);
        return;
      }

      // If ride date/time has passed:
      // - Pending request: exclude from active Ride Requests tab
      // - Accepted request: ride is completed (offered ride appears under Completed)
      if (isExpired) {
        return;
      }

      requestsTabItems.push(item);
    });

    const upcomingTabItems = [];
    myRequestsRaw.forEach(req => {
      const offerer = profiles.find(p => p.id === req.ride?.offered_by);
      let displayStatus = 'Pending Confirmation';
      if (req.status === 'accepted') displayStatus = 'Accepted';
      if (req.status === 'declined') displayStatus = 'Declined';
      if (req.status === 'cancelled') displayStatus = 'Cancelled';

      // Attach phone only when accepted
      const isAccepted = req.status === 'accepted';
      const personPhone = isAccepted ? (acceptedPhoneMap.get(req.ride?.offered_by) || '') : null;
      const isExpired = isRideExpired(req.ride?.ride_date, req.ride?.departure_time);

      const item = {
        id: req.id,
        rideId: req.ride_id,
        personOffering: offerer?.name || 'RideSaathi User',
        personPhoto: offerer?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        personPhone: personPhone,
        from: req.ride?.from_location || '',
        to: req.ride?.to_location || '',
        date: req.ride?.ride_date || '',
        time: req.ride?.departure_time || '',
        seatsRequested: req.seats_requested,
        status: displayStatus
      };

      if (req.status === 'declined' || req.status === 'cancelled') {
        cancelledRides.push(item);
        return;
      }

      if (isExpired) {
        if (isAccepted) {
          // Accepted ride whose date/time passed -> Move to Completed tab with contact phone intact
          completedRides.push({
            ...item,
            status: 'Completed'
          });
        }
        // If pending and expired -> Exclude from active Upcoming tab (do not delete DB record)
        return;
      }

      // Unexpired active upcoming journey
      upcomingTabItems.push(item);
    });

    return {
      data: {
        offered: offeredRides,
        requests: requestsTabItems,
        upcoming: upcomingTabItems,
        completed: completedRides,
        cancelled: cancelledRides
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
