import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { authService } from '../services/authService';
import { rideService } from '../services/rideService';
import { notificationService } from '../services/notificationService';
import {
  initialUser,
  initialRides,
  initialNotifications,
  initialActivity,
  initialRecurringRides
} from '../mock/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(initialUser);
  const [rides, setRides] = useState(initialRides);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activity, setActivity] = useState(initialActivity);
  const [recurringRides, setRecurringRides] = useState(initialRecurringRides);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchCriteria, setSearchCriteria] = useState({
    from: '',
    to: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    totalSeats: 1,
    seatLabel: 'Just me'
  });

  const [searchResults, setSearchResults] = useState([]);

  // Initialize Supabase Auth Listener & Load Data
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
          id: r.id, // Real database UUID
          personName: r.offered_by_profile?.name || 'RideSaathi User',
          personPhoto: r.offered_by_profile?.photo_url || initialUser.photo,
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
        setRides([]); // Clear mock rides if Supabase table is empty or error
      }
    });

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        authService.getProfile(session.user.id).then(({ data: profile }) => {
          setUser({
            id: session.user.id,
            name: profile?.name || session.user.user_metadata?.full_name || 'User',
            phone: profile?.phone || '',
            photo: profile?.photo_url || session.user.user_metadata?.avatar_url || initialUser.photo,
            isAdmin: profile?.is_admin || false,
            isAuthenticated: true,
            isSetupComplete: Boolean(profile?.name && profile?.phone)
          });

          // Fetch user activity journeys
          fetchUserActivity(session.user.id);

          // Fetch notifications
          notificationService.getUserNotifications(session.user.id).then(({ data }) => {
            if (data && data.length > 0) setNotifications(data);
          });

          // Realtime Notifications
          unsubscribeNotifs = notificationService.subscribeToNotifications(session.user.id, (newNotif) => {
            setNotifications(prev => [newNotif, ...prev]);
          });
        });
      }
      setLoading(false);
    });

    // Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await authService.getProfile(session.user.id);
        setUser({
          id: session.user.id,
          name: profile?.name || session.user.user_metadata?.full_name || 'User',
          phone: profile?.phone || '',
          photo: profile?.photo_url || session.user.user_metadata?.avatar_url || initialUser.photo,
          isAdmin: profile?.is_admin || false,
          isAuthenticated: true,
          isSetupComplete: Boolean(profile?.name && profile?.phone)
        });

        // Fetch user activity journeys
        fetchUserActivity(session.user.id);

        // Fetch notifications
        notificationService.getUserNotifications(session.user.id).then(({ data }) => {
          setNotifications(data || []);
        });

        // Realtime Notifications
        if (unsubscribeNotifs) unsubscribeNotifs();
        unsubscribeNotifs = notificationService.subscribeToNotifications(session.user.id, (newNotif) => {
          setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
        });
      } else {
        setUser(initialUser);
        setNotifications([]);
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeNotifs();
    };
  }, []);

  // Search logic
  const performSearch = async (criteria) => {
    const updatedCriteria = { ...searchCriteria, ...criteria };
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
          personName: r.offered_by_profile?.name || 'RideSaathi User',
          personPhoto: r.offered_by_profile?.photo_url || initialUser.photo,
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
    const filtered = rides.filter(ride => {
      const seatsOk = ride.availableSeats >= updatedCriteria.totalSeats;
      const fromOk = !updatedCriteria.from || ride.from.toLowerCase().includes(updatedCriteria.from.toLowerCase());
      const toOk = !updatedCriteria.to || ride.to.toLowerCase().includes(updatedCriteria.to.toLowerCase());
      return seatsOk && fromOk && toOk;
    });

    setSearchResults(filtered);
    return filtered;
  };

  const addRide = async (newRide) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await rideService.createRide(newRide);
      if (error) {
        console.error('AppContext addRide Error:', error);
        return { data: null, error };
      }
      if (data) {
        const formatted = {
          id: data.id,
          personName: user.name || "User",
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
          personOffering: "You (" + (user.name || "User") + ")",
          personPhoto: user.photo,
          from: data.from_location,
          to: data.to_location,
          date: data.ride_date,
          time: data.departure_time,
          availableSeats: data.available_seats,
          status: "Active Offer"
        };
        setActivity(prev => ({
          ...prev,
          offered: [offeredItem, ...prev.offered]
        }));

        return { data: formatted, error: null };
      }
    }

    // Local state fallback
    const rideObj = {
      id: `ride-${Date.now()}`,
      personName: user.name || "Rahul Sharma",
      personPhoto: user.photo,
      ...newRide
    };
    setRides([rideObj, ...rides]);

    const offeredItem = {
      id: `act-${Date.now()}`,
      personOffering: "You (" + (user.name || "Rahul") + ")",
      personPhoto: user.photo,
      from: newRide.from,
      to: newRide.to,
      date: newRide.date,
      time: newRide.departureTime,
      availableSeats: newRide.availableSeats,
      status: "Active Offer"
    };
    setActivity(prev => ({
      ...prev,
      offered: [offeredItem, ...prev.offered]
    }));

    return rideObj;
  };

  const addRecurringRide = async (newRecRide) => {
    if (isSupabaseConfigured() && user?.id) {
      await rideService.createRecurringRide({
        offeredBy: user.id,
        ...newRecRide
      });
    }

    const recObj = {
      id: `rec-${Date.now()}`,
      ...newRecRide,
      status: "Active"
    };
    setRecurringRides([recObj, ...recurringRides]);
  };

  const requestJoinRide = async (ride, requestedSeatsCount) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await rideService.sendRideRequest({
        rideId: ride?.id,
        seatsRequested: requestedSeatsCount
      });

      if (error) {
        console.error('AppContext requestJoinRide Error:', error);
        return { data: null, error };
      }

      if (data) {
        notificationService.getUserNotifications(user?.id).then(({ data: freshNotifs }) => {
          if (freshNotifs && freshNotifs.length > 0) {
            setNotifications(freshNotifs);
          }
        });

        const newAct = {
          id: data.id,
          personOffering: ride?.personName || 'User',
          personPhoto: ride?.personPhoto,
          from: ride?.from,
          to: ride?.to,
          date: ride?.date,
          time: ride?.departureTime,
          seatsRequested: requestedSeatsCount,
          status: "Pending Confirmation"
        };
        setActivity(prev => ({
          ...prev,
          upcoming: [newAct, ...prev.upcoming]
        }));

        return { data, error: null };
      }
    }

    // Local state fallback
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: "Ride Request Sent",
      message: `Your request to join ${ride?.personName || 'User'}'s ride (${ride?.from || ''} -> ${ride?.to || ''}) for ${requestedSeatsCount} seat(s) was sent.`,
      time: "Just now",
      type: "request",
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    const newAct = {
      id: `act-${Date.now()}`,
      personOffering: ride?.personName || 'User',
      personPhoto: ride?.personPhoto,
      from: ride?.from,
      to: ride?.to,
      date: ride?.date,
      time: ride?.departureTime,
      seatsRequested: requestedSeatsCount,
      status: "Pending Confirmation"
    };
    setActivity(prev => ({
      ...prev,
      upcoming: [newAct, ...prev.upcoming]
    }));

    return { data: newAct, error: null };
  };

  const fetchUserActivity = async (userId) => {
    if (!isSupabaseConfigured() || !userId) return;
    const { data, error } = await rideService.getUserActivity(userId);
    if (!error && data) {
      setActivity({
        offered: data.offered || [],
        requests: data.requests || [],
        upcoming: data.upcoming || [],
        completed: data.completed || [],
        cancelled: data.cancelled || []
      });
    }
  };

  const acceptRequest = async (requestId) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await rideService.acceptRideRequest(requestId, user?.id);
      if (error) {
        console.error('AppContext acceptRequest Error:', error);
      } else if (data?.success === false) {
        console.warn('Overbooking prevented:', data.message);
        alert(`Cannot accept request: ${data.message}`);
      }
      await fetchUserActivity(user?.id);
    } else {
      setActivity(prev => ({
        ...prev,
        requests: prev.requests.map(req => req.id === requestId ? { ...req, status: "Accepted" } : req)
      }));
    }
  };

  const declineRequest = async (requestId) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await rideService.declineRideRequest(requestId);
      if (error) {
        console.error('AppContext declineRequest Error:', error);
      }
      await fetchUserActivity(user?.id);
    } else {
      setActivity(prev => ({
        ...prev,
        requests: prev.requests.map(req => req.id === requestId ? { ...req, status: "Declined" } : req)
      }));
    }
  };

  const markNotificationRead = async (notifId) => {
    if (isSupabaseConfigured()) {
      await notificationService.markAsRead(notifId);
    }
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const getRideById = (id) => {
    if (!id) return null;
    const foundInRides = rides.find(r => String(r.id) === String(id));
    if (foundInRides) return foundInRides;
    const foundInSearch = searchResults.find(r => String(r.id) === String(id));
    if (foundInSearch) return foundInSearch;
    return null;
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
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
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
