import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { authService } from '../services/authService';
import { rideService } from '../services/rideService';
import { notificationService } from '../services/notificationService';
import { validatePhoneNumber } from '../lib/phoneUtils';
import { isRideExpired, getTodayDateIST } from '../lib/timeUtils';
import {
  defaultGuestUser
} from '../mock/mockData';
import { DEFAULT_AVATAR } from '../lib/imageUtils';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(defaultGuestUser);
  const [rides, setRides] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activity, setActivity] = useState({
    upcoming: [],
    requests: [],
    offered: [],
    completed: [],
    cancelled: []
  });
  const [recurringRides, setRecurringRides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchCriteria, setSearchCriteria] = useState({
    from: '',
    to: '',
    date: getTodayDateIST(),
    time: '',
    totalSeats: 1,
    seatLabel: 'Just me'
  });

  const [searchResults, setSearchResults] = useState([]);

  // ============================================================
  // INITIALIZE SUPABASE AUTH LISTENER & LOAD DATA
  // ============================================================

  useEffect(() => {
    let unsubscribeNotifs = () => {};

    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    // Load active rides directly from Supabase public.rides
    rideService.searchRides({}).then(({ data, error }) => {
      if (!error && data) {
        const formatted = data.map(r => ({
          id: r.id,
          offeredBy: r.offered_by,
          offered_by: r.offered_by,
          offeredByProfile: r.offered_by_profile,
          personName: r.offered_by_profile?.name || 'RideSaathi User',
          personPhoto:
            r.offered_by_profile?.photo_url || DEFAULT_AVATAR,
          from: r.from_location,
          to: r.to_location,
          date: r.ride_date,
          departureTime: r.departure_time,
          availableSeats: r.available_seats,
          note: r.note,
          preferences: r.preferences || []
        }));

        setRides(formatted);
      } else {
        setRides([]);
      }
    });

    // Helper to sync user profile from Supabase or Google session
    const syncUserProfile = async (sessionUser) => {
      if (!sessionUser) {
        setUser(defaultGuestUser);
        setNotifications([]);
        setActivity({
          upcoming: [],
          requests: [],
          offered: [],
          completed: [],
          cancelled: []
        });
        return;
      }

      let { data: profile } = await authService.getProfile(sessionUser.id);

      // Auto-upsert profile if not found for a Google user
      if (!profile) {
        const googleName =
          sessionUser.user_metadata?.full_name ||
          sessionUser.user_metadata?.name ||
          sessionUser.email?.split('@')[0] ||
          'User';
        const googlePhoto =
          sessionUser.user_metadata?.avatar_url ||
          sessionUser.user_metadata?.picture ||
          DEFAULT_AVATAR;
        const googlePhone = sessionUser.user_metadata?.phone || '';

        const { data: createdProfile } = await authService.updateProfile(sessionUser.id, {
          name: googleName,
          phone: googlePhone,
          photo_url: googlePhoto
        });

        if (createdProfile) {
          profile = createdProfile;
        }
      }

      const isUserAdmin = Boolean(
        profile?.is_admin === true ||
        profile?.is_admin === 'true' ||
        profile?.is_admin === 'TRUE' ||
        profile?.is_admin === 't' ||
        profile?.is_admin === 1 ||
        sessionUser.app_metadata?.is_admin === true ||
        sessionUser.user_metadata?.is_admin === true ||
        sessionUser.app_metadata?.role === 'admin' ||
        sessionUser.user_metadata?.role === 'admin' ||
        sessionUser.email?.toLowerCase() === 'daviralbajpai@gmail.com'
      );

      const resolvedPhoto =
        profile?.photo_url ||
        sessionUser.user_metadata?.avatar_url ||
        sessionUser.user_metadata?.picture ||
        DEFAULT_AVATAR;

      const resolvedName =
        profile?.name ||
        sessionUser.user_metadata?.full_name ||
        sessionUser.user_metadata?.name ||
        sessionUser.email?.split('@')[0] ||
        'User';

      const resolvedPhone = profile?.phone || sessionUser.user_metadata?.phone || '';

      setUser({
        id: sessionUser.id,
        email: sessionUser.email,
        name: resolvedName,
        phone: resolvedPhone,
        photo: resolvedPhoto,
        isAdmin: isUserAdmin,
        isAuthenticated: true,
        isSetupComplete: Boolean(resolvedName && resolvedPhone)
      });

      // Fetch user activity journeys
      fetchUserActivity(sessionUser.id);

      // Fetch notifications
      notificationService
        .getUserNotifications(sessionUser.id)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setNotifications(data);
          }
        });

      // Realtime Notifications
      if (unsubscribeNotifs) {
        unsubscribeNotifs();
      }

      unsubscribeNotifs = notificationService.subscribeToNotifications(
        sessionUser.id,
        newNotif => {
          setNotifications(prev => [
            newNotif,
            ...prev.filter(n => n.id !== newNotif.id)
          ]);
        }
      );
    };

    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await syncUserProfile(session.user);
      } else {
        setUser(defaultGuestUser);
      }
      setLoading(false);
    });

    // Auth State Listener
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await syncUserProfile(session.user);
      } else {
        setUser(defaultGuestUser);
        setNotifications([]);
        setActivity({
          upcoming: [],
          requests: [],
          offered: [],
          completed: [],
          cancelled: []
        });
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeNotifs();
    };
  }, []);

  // ============================================================
  // SEARCH LOGIC
  // ============================================================

  const performSearch = async criteria => {
    const updatedCriteria = {
      ...searchCriteria,
      ...criteria
    };

    setSearchCriteria(updatedCriteria);

    if (isSupabaseConfigured()) {
      const { data, error } = await rideService.searchRides({
        from: updatedCriteria.from,
        to: updatedCriteria.to,
        date: updatedCriteria.date,
        totalSeats: updatedCriteria.totalSeats
      });

      if (!error && data) {
        const formatted = data.map(r => ({
          id: r.id,
          offeredBy: r.offered_by,
          offered_by: r.offered_by,
          offeredByProfile: r.offered_by_profile,
          personName:
            r.offered_by_profile?.name || 'RideSaathi User',
          personPhoto:
            r.offered_by_profile?.photo_url || DEFAULT_AVATAR,
          from: r.from_location,
          to: r.to_location,
          date: r.ride_date,
          departureTime: r.departure_time,
          availableSeats: r.available_seats,
          note: r.note,
          preferences: r.preferences || []
        }));

        setSearchResults(formatted);
        return formatted;
      }
    }

    // Local fallback search if Supabase not configured
    const getSearchStr = (v) => {
      if (!v) return '';
      if (typeof v === 'object') return (v.name || v.label || '').toLowerCase();
      return String(v).toLowerCase();
    };
    const fromSearch = getSearchStr(updatedCriteria.from);
    const toSearch = getSearchStr(updatedCriteria.to);

    const filtered = rides.filter(ride => {
      if (isRideExpired(ride.date, ride.departureTime)) {
        return false;
      }

      const seatsOk =
        ride.availableSeats >= updatedCriteria.totalSeats;

      const fromOk =
        !fromSearch ||
        ride.from.toLowerCase().includes(fromSearch) ||
        fromSearch.includes(ride.from.toLowerCase().split(',')[0].trim());

      const toOk =
        !toSearch ||
        ride.to.toLowerCase().includes(toSearch) ||
        toSearch.includes(ride.to.toLowerCase().split(',')[0].trim());

      return seatsOk && fromOk && toOk;
    });

    setSearchResults(filtered);
    return filtered;
  };

  // ============================================================
  // ADD RIDE
  // ============================================================

  const addRide = async newRide => {
    const phoneVal = validatePhoneNumber(user?.phone);
    if (!phoneVal.isValid) {
      return {
        data: null,
        error: new Error('A valid 10-digit phone number is required before offering a ride. Please add your phone number in your Profile.')
      };
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await rideService.createRide(newRide);

      if (error) {
        console.error('AppContext addRide Error:', error);

        return {
          data: null,
          error
        };
      }

      if (data) {
        const formatted = {
          id: data.id,
          offeredBy: data.offered_by,
          offered_by: data.offered_by,
          personName: user.name || 'User',
          personPhoto: user.photo,
          from: data.from_location,
          to: data.to_location,
          date: data.ride_date,
          departureTime: data.departure_time,
          availableSeats: data.available_seats,
          note: data.note,
          preferences: data.preferences || []
        };

        setRides(prev => [formatted, ...prev]);

        const offeredItem = {
          id: data.id,
          personOffering:
            'You (' + (user.name || 'User') + ')',
          personPhoto: user.photo,
          from: data.from_location,
          to: data.to_location,
          date: data.ride_date,
          time: data.departure_time,
          availableSeats: data.available_seats,
          status: 'Active Offer'
        };

        setActivity(prev => ({
          ...prev,
          offered: [offeredItem, ...prev.offered]
        }));

        return {
          data: formatted,
          error: null
        };
      }
    }

    // Local state fallback
    const fromLabel = typeof newRide.from === 'object' ? newRide.from.label : newRide.from;
    const toLabel = typeof newRide.to === 'object' ? newRide.to.label : newRide.to;

    const rideObj = {
      id: `ride-${Date.now()}`,
      personName: user.name || 'User',
      personPhoto: user.photo || DEFAULT_AVATAR,
      ...newRide,
      from: fromLabel,
      to: toLabel
    };

    setRides(prev => [rideObj, ...prev]);

    const offeredItem = {
      id: `act-${Date.now()}`,
      personOffering:
        'You (' + (user.name || 'User') + ')',
      personPhoto: user.photo || DEFAULT_AVATAR,
      from: newRide.from,
      to: newRide.to,
      date: newRide.date,
      time: newRide.departureTime,
      availableSeats: newRide.availableSeats,
      status: 'Active Offer'
    };

    setActivity(prev => ({
      ...prev,
      offered: [offeredItem, ...prev.offered]
    }));

    return rideObj;
  };

  // ============================================================
  // ADD RECURRING RIDE
  // ============================================================

  const addRecurringRide = async newRecRide => {
    if (isSupabaseConfigured() && user?.id) {
      await rideService.createRecurringRide({
        offeredBy: user.id,
        ...newRecRide
      });
    }

    const recObj = {
      id: `rec-${Date.now()}`,
      ...newRecRide,
      status: 'Active'
    };

    setRecurringRides(prev => [recObj, ...prev]);
  };

  // ============================================================
  // REQUEST TO JOIN RIDE
  // ============================================================

  const requestJoinRide = async (
    ride,
    requestedSeatsCount
  ) => {
    // Defense: A user cannot book/request their own offered ride
    const isOwnRide = Boolean(
      (user?.id && (ride?.offeredBy === user.id || ride?.offered_by === user.id || ride?.offeredByProfile?.id === user.id)) ||
      (user?.name && user.name.trim() !== '' && ride?.personName === user.name)
    );

    if (isOwnRide) {
      return {
        data: null,
        error: new Error('You cannot request or book a ride that you offered.')
      };
    }

    const phoneVal = validatePhoneNumber(user?.phone);
    if (!phoneVal.isValid) {
      return {
        data: null,
        error: new Error('A valid 10-digit phone number is required before requesting a ride. Please add your phone number in your Profile.')
      };
    }

    if (isSupabaseConfigured()) {
      const { data, error } =
        await rideService.sendRideRequest({
          rideId: ride?.id,
          seatsRequested: requestedSeatsCount
        });

      if (error) {
        console.error(
          'AppContext requestJoinRide Error:',
          error
        );

        return {
          data: null,
          error
        };
      }

      if (data) {
        // Refresh notifications
        notificationService
          .getUserNotifications(user?.id)
          .then(({ data: freshNotifs }) => {
            if (freshNotifs && freshNotifs.length > 0) {
              setNotifications(freshNotifs);
            }
          });

        const newAct = {
          id: data.id,
          personOffering:
            ride?.personName || 'User',
          personPhoto: ride?.personPhoto,
          from: ride?.from,
          to: ride?.to,
          date: ride?.date,
          time: ride?.departureTime,
          seatsRequested: requestedSeatsCount,
          status: 'Pending Confirmation'
        };

        setActivity(prev => ({
          ...prev,
          upcoming: [newAct, ...prev.upcoming]
        }));

        return {
          data,
          error: null
        };
      }
    }

    // Local state fallback
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Ride Request Sent',
      message:
        `Your request to join ` +
        `${ride?.personName || 'User'}'s ride ` +
        `(${ride?.from || ''} -> ${ride?.to || ''}) ` +
        `for ${requestedSeatsCount} seat(s) was sent.`,
      time: 'Just now',
      type: 'request',
      read: false
    };

    setNotifications(prev => [
      newNotif,
      ...prev
    ]);

    const newAct = {
      id: `act-${Date.now()}`,
      personOffering:
        ride?.personName || 'User',
      personPhoto: ride?.personPhoto,
      from: ride?.from,
      to: ride?.to,
      date: ride?.date,
      time: ride?.departureTime,
      seatsRequested: requestedSeatsCount,
      status: 'Pending Confirmation'
    };

    setActivity(prev => ({
      ...prev,
      upcoming: [newAct, ...prev.upcoming]
    }));

    return {
      data: newAct,
      error: null
    };
  };

  // ============================================================
  // FETCH USER ACTIVITY
  // ============================================================

  const fetchUserActivity = async userId => {
    if (!isSupabaseConfigured() || !userId) {
      return;
    }

    const { data, error } =
      await rideService.getUserActivity(userId);

    if (data) {
      setActivity({
        offered: data.offered || [],
        requests: data.requests || [],
        upcoming: data.upcoming || [],
        completed: data.completed || [],
        cancelled: data.cancelled || []
      });
    }
  };

  // ============================================================
  // ACCEPT RIDE REQUEST
  // ============================================================

  const acceptRequest = async requestId => {
    if (isSupabaseConfigured()) {
      const { data, error } =
        await rideService.acceptRideRequest(
          requestId,
          user?.id
        );

      if (error) {
        console.error(
          'AppContext acceptRequest Error:',
          error
        );
      } else if (data?.success === false) {
        console.warn(
          'Overbooking prevented:',
          data.message
        );

        alert(
          `Cannot accept request: ${data.message}`
        );
      }

      await fetchUserActivity(user?.id);
    } else {
      setActivity(prev => ({
        ...prev,
        requests: prev.requests.map(req =>
          req.id === requestId
            ? {
                ...req,
                status: 'Accepted',
                personPhone: req.personPhone || '+91 98765 43210'
              }
            : req
        )
      }));
    }
  };

  // ============================================================
  // DECLINE RIDE REQUEST
  // ============================================================

  const declineRequest = async requestId => {
    if (isSupabaseConfigured()) {
      const { data, error } =
        await rideService.declineRideRequest(
          requestId
        );

      if (error) {
        console.error(
          'AppContext declineRequest Error:',
          error
        );
      }

      await fetchUserActivity(user?.id);
    } else {
      setActivity(prev => ({
        ...prev,
        requests: prev.requests.map(req =>
          req.id === requestId
            ? {
                ...req,
                status: 'Declined'
              }
            : req
        )
      }));
    }
  };

  // ============================================================
  // NOTIFICATION
  // ============================================================

  const markNotificationRead = async notifId => {
    if (isSupabaseConfigured()) {
      await notificationService.markAsRead(notifId);
    }

    setNotifications(prev =>
      prev.map(n =>
        n.id === notifId
          ? {
              ...n,
              read: true
            }
          : n
      )
    );
  };

  // ============================================================
  // GET RIDE BY ID
  // ============================================================

  const getRideById = id => {
    if (!id) {
      return null;
    }

    const foundInRides = rides.find(
      r => String(r.id) === String(id)
    );

    if (foundInRides) {
      return foundInRides;
    }

    const foundInSearch = searchResults.find(
      r => String(r.id) === String(id)
    );

    if (foundInSearch) {
      return foundInSearch;
    }

    return null;
  };

  // ============================================================
  // UPDATE USER PROFILE
  // ============================================================

  const updateUserProfile = async ({ name, phone, photo }) => {
    let resolvedPhone = user.phone;
    if (phone !== undefined) {
      const val = validatePhoneNumber(phone);
      if (!val.isValid) {
        return {
          data: null,
          error: new Error(val.error || 'Please enter a valid 10-digit phone number.')
        };
      }
      resolvedPhone = val.formatted;
    }

    const updatedUser = {
      ...user,
      name: name !== undefined ? name : user.name,
      phone: resolvedPhone,
      photo: photo !== undefined ? photo : user.photo,
      isSetupComplete: true
    };

    setUser(updatedUser);

    if (isSupabaseConfigured() && user?.id) {
      const { data, error } = await authService.updateProfile(user.id, {
        name: updatedUser.name,
        phone: updatedUser.phone,
        photo_url: updatedUser.photo
      });

      if (error) {
        console.error('Error updating profile in Supabase:', error);
        return { data: null, error };
      }

      return { data, error: null };
    }

    return { data: updatedUser, error: null };
  };

  // ============================================================
  // CONTEXT PROVIDER
  // ============================================================

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        updateUserProfile,
        rides,
        getRideById,
        addRide,
        searchCriteria,
        setSearchCriteria,
        searchResults,
        performSearch,
        requestJoinRide,
        notifications,
        setNotifications,
        markNotificationRead,
        activity,
        fetchUserActivity,
        acceptRequest,
        declineRequest,
        recurringRides,
        addRecurringRide,
        loading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);