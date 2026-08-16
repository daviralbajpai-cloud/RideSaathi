import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export const SignInPage = () => {
  const navigate = useNavigate();
  const { setUser, user } = useApp();
  
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Option 1: Google OAuth Login for normal users
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');

    if (isSupabaseConfigured()) {
      const { error } = await authService.signInWithGoogle();
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
      return;
    }

    // Demo fallback login if Supabase env vars not configured yet
    setTimeout(() => {
      setLoading(false);
      setUser(prev => ({ ...prev, isAuthenticated: true }));
      if (user?.isSetupComplete) {
        navigate('/home');
      } else {
        navigate('/profile-setup');
      }
    }, 500);
  };

  // Option 2: Admin Authentication (Email + Password + Database `is_admin = true` check)
  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!isSupabaseConfigured()) {
      setErrorMsg("Authentication service is unavailable. Administrative login requires active connection to Supabase database.");
      setLoading(false);
      return;
    }

    const { data, error } = await authService.signInWithAdminPassword(adminEmail, adminPassword);
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setUser({
      id: data.user.id,
      name: data.profile.name,
      phone: data.profile.phone,
      photo: data.profile.photo_url,
      isAdmin: Boolean(data.profile?.is_admin),
      isAuthenticated: true,
      isSetupComplete: true
    });

    setLoading(false);
    navigate('/admin');
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between px-container-margin py-xl max-w-[600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col items-center text-center mt-lg">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-md">
          <span className="material-symbols-outlined text-on-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            directions_car
          </span>
        </div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold mb-xs">
          RideSaathi
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[280px]">
          Sign in to connect with commuters and share your journey.
        </p>
      </div>

      {/* Main Form Box */}
      <div className="my-auto py-md flex flex-col items-center gap-md w-full">
        <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-lg shadow-sm flex flex-col gap-md">
          {errorMsg && (
            <div className="p-md rounded-xl bg-error-container text-on-error-container text-body-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {!showAdminForm ? (
            <>
              <div className="text-center">
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold mb-1">
                  Welcome to RideSaathi
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  One account to find or offer rides anytime.
                </p>
              </div>

              {/* Option 1: Google OAuth */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full min-h-[52px] bg-surface border border-outline text-on-surface rounded-xl font-label-bold text-label-bold flex items-center justify-center gap-3 hover:bg-surface-container-low transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <div className="relative flex py-sm items-center">
                <div className="flex-grow border-t border-outline-variant/40"></div>
                <span className="flex-shrink-0 mx-3 text-outline font-body-sm text-[12px]">or</span>
                <div className="flex-grow border-t border-outline-variant/40"></div>
              </div>

              {/* Option 2 Toggle: Admin Login */}
              <button
                type="button"
                onClick={() => {
                  setShowAdminForm(true);
                  setErrorMsg('');
                }}
                className="w-full min-h-[48px] bg-surface-container-low border border-outline-variant/40 text-on-surface-variant rounded-xl font-label-bold text-body-sm flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                Admin Login
              </button>
            </>
          ) : (
            /* Option 2 Form: Admin Login (Email + Password) */
            <form onSubmit={handleAdminSignIn} className="flex flex-col gap-md">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                  Admin Authentication
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminForm(false);
                    setErrorMsg('');
                  }}
                  className="text-outline hover:text-on-surface text-sm"
                >
                  Back
                </button>
              </div>

              <div>
                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@ridesaathi.com"
                  className="w-full h-[52px] px-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-lg text-on-surface outline-none"
                />
              </div>

              <div>
                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[52px] px-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-lg text-on-surface outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[52px] bg-primary text-on-primary rounded-xl font-label-bold text-label-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">lock</span>
                    Sign In as Admin
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center font-body-sm text-[12px] text-outline">
        By signing in, you agree to our Terms of Service & Privacy Policy.
      </div>
    </div>
  );
};
