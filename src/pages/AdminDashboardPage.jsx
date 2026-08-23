import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { adminService } from '../services/adminService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    // 1. Client-Side & Database Security Check
    const isUserAdmin = Boolean(
      user?.isAdmin ||
      user?.email?.toLowerCase() === 'daviralbajpai@gmail.com'
    );

    if (!user || !isUserAdmin) {
      setError("Access Denied: Administrative permissions required.");
      setLoading(false);
      return;
    }

    if (isSupabaseConfigured()) {
      adminService.getAdminStats().then(({ data, error: apiErr }) => {
        if (apiErr) {
          setError(apiErr.message || "Failed to load admin statistics.");
        } else {
          setStats(data);
        }
        setLoading(false);
      });
    } else {
      // Demo Stats fallback if Supabase env vars not configured yet
      setStats({
        users: {
          total: 12,
          newCount: 4,
          list: [
            { id: '1', name: 'Rahul Sharma', phone: '+91 98765 43210', created_at: '2026-08-15T10:00:00Z', is_admin: true },
            { id: '2', name: 'Priya Patel', phone: '+91 98765 11111', created_at: '2026-08-14T12:30:00Z', is_admin: false },
            { id: '3', name: 'Amit Sharma', phone: '+91 98765 22222', created_at: '2026-08-12T09:15:00Z', is_admin: false },
            { id: '4', name: 'Sneha Verma', phone: '+91 98765 33333', created_at: '2026-08-10T14:20:00Z', is_admin: false }
          ]
        },
        rides: {
          total: 8,
          active: 5,
          completed: 2,
          cancelled: 1,
          list: [
            { id: 'r1', offered_by_profile: { name: 'Priya Patel' }, from_location: 'Hazratganj', to_location: 'Gomti Nagar', ride_date: '2026-08-16', departure_time: '08:30 AM', status: 'active' },
            { id: 'r2', offered_by_profile: { name: 'Amit Sharma' }, from_location: 'Lucknow', to_location: 'Kanpur', ride_date: '2026-08-16', departure_time: '09:00 AM', status: 'active' },
            { id: 'r3', offered_by_profile: { name: 'Sneha Verma' }, from_location: 'Indira Nagar', to_location: 'Alambagh', ride_date: '2026-08-16', departure_time: '10:15 AM', status: 'active' }
          ]
        },
        requests: {
          total: 6,
          pending: 3,
          accepted: 2,
          declined: 1,
          list: [
            { id: 'req1', requester: { name: 'Rahul Sharma' }, ride: { from_location: 'Hazratganj', to_location: 'Gomti Nagar' }, seats_requested: 3, status: 'pending', created_at: '2026-08-16T08:00:00Z' },
            { id: 'req2', requester: { name: 'Priya Patel' }, ride: { from_location: 'Lucknow', to_location: 'Kanpur' }, seats_requested: 1, status: 'accepted', created_at: '2026-08-15T15:30:00Z' }
          ]
        }
      });
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="w-full flex-1 flex items-center justify-center p-xl">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
      </div>
    );
  }

  if (error || !user?.isAdmin) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center text-center px-container-margin py-xl my-auto">
        <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center text-3xl mb-md">
          <span className="material-symbols-outlined">gpp_bad</span>
        </div>
        <h2 className="font-headline-md text-xl font-bold text-on-surface mb-1">
          Access Restricted
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px] mb-6">
          {error || "Administrative permissions required to view this dashboard."}
        </p>
        <button
          onClick={() => navigate('/home')}
          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-bold text-sm shadow-sm"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="Admin Dashboard" showBack={true} />

      {/* Admin Navigation Header */}
      <div className="w-full bg-surface-container-lowest border-b border-outline-variant/30 px-container-margin py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { key: 'summary', label: 'Summary' },
          { key: 'users', label: `Users (${stats?.users.total || 0})` },
          { key: 'rides', label: `Rides (${stats?.rides.total || 0})` },
          { key: 'requests', label: `Requests (${stats?.requests.total || 0})` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-full text-body-sm whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-container-margin py-md flex flex-col gap-lg pb-24">
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="flex flex-col gap-md">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Platform Overview
            </h2>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-1">
                <span className="font-body-sm text-outline font-medium">Total Users</span>
                <span className="font-display-sm text-2xl font-bold text-primary">{stats?.users.total}</span>
                <span className="text-[11px] text-secondary font-medium">+{stats?.users.newCount} this week</span>
              </div>

              <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-1">
                <span className="font-body-sm text-outline font-medium">Total Rides</span>
                <span className="font-display-sm text-2xl font-bold text-secondary">{stats?.rides.total}</span>
                <span className="text-[11px] text-on-surface-variant">{stats?.rides.active} active now</span>
              </div>

              <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-1">
                <span className="font-body-sm text-outline font-medium">Ride Requests</span>
                <span className="font-display-sm text-2xl font-bold text-tertiary">{stats?.requests.total}</span>
                <span className="text-[11px] text-on-surface-variant">{stats?.requests.pending} pending</span>
              </div>

              <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-1">
                <span className="font-body-sm text-outline font-medium">Completed</span>
                <span className="font-display-sm text-2xl font-bold text-on-surface">{stats?.rides.completed}</span>
                <span className="text-[11px] text-outline">Successful rides</span>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-3">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              User Directory
            </h2>
            <div className="flex flex-col gap-2">
              {stats?.users.list.map((u) => (
                <div key={u.id} className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-headline-md text-body-md font-bold text-on-surface flex items-center gap-1.5">
                      {u.name}
                      {u.is_admin && (
                        <span className="px-1.5 py-0.2 rounded-md bg-primary/15 text-primary text-[10px] font-bold">
                          ADMIN
                        </span>
                      )}
                    </h3>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">
                      {u.phone || 'No phone number'}
                    </p>
                  </div>
                  <span className="text-body-sm text-outline text-[11px]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RIDES TAB */}
        {activeTab === 'rides' && (
          <div className="flex flex-col gap-3">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Ride Listings
            </h2>
            <div className="flex flex-col gap-2">
              {stats?.rides.list.map((r) => (
                <div key={r.id} className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-md text-body-md font-bold text-on-surface">
                      {r.from_location} → {r.to_location}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                      {r.status}
                    </span>
                  </div>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">
                    Offered by: {r.offered_by_profile?.name || 'User'} | {r.ride_date} at {r.departure_time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div className="flex flex-col gap-3">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Ride Requests Log
            </h2>
            <div className="flex flex-col gap-2">
              {stats?.requests.list.map((req) => (
                <div key={req.id} className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-md text-body-md font-bold text-on-surface">
                      Requester: {req.requester?.name || 'User'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary text-[11px] font-bold">
                      {req.status}
                    </span>
                  </div>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">
                    Ride: {req.ride?.from_location} → {req.ride?.to_location} ({req.seats_requested} seats)
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
