import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import heroImage from '../assets/hero-banner.jpg';

export const WelcomePage = () => {
  const navigate = useNavigate();
  const { setUser, user } = useApp();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

    // Demo fallback login if Supabase env vars not configured
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

  return (
    <div className="w-full flex-1 flex flex-col relative pb-xl">
      {/* Welcome Hero Section */}
      <section className="hero-pattern pt-xl pb-lg px-container-margin rounded-b-[2rem] shadow-sm relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col items-center text-center mt-md">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-lg">
            <span className="material-symbols-outlined text-on-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              directions_car
            </span>
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-xs font-bold">
            RideSaathi
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[280px]">
            Find people travelling your way.
          </p>
          <div className="mt-lg w-full max-w-[280px] rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)] bg-surface border border-outline-variant/30 p-2 flex items-center justify-center">
            <img
              src={heroImage}
              alt="RideSaathi Commute"
              className="w-full aspect-square object-contain rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Actions Section - Only Google Login */}
      <section className="px-container-margin mt-xl flex flex-col gap-3">
        <p className="font-body-sm text-body-sm text-on-surface-variant text-center mb-sm px-lg font-medium">
          Serving Those Who Serve the Nation
        </p>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full min-h-[52px] bg-surface border border-outline-variant/60 text-on-surface rounded-xl font-label-bold text-label-bold flex items-center justify-center gap-3 hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
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

        {/* Subtle Admin Sign In Link */}
        <div className="text-center mt-2">
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="text-[12px] font-medium text-outline hover:text-primary transition-colors cursor-pointer"
          >
            Admin Sign In
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="px-container-margin mt-xl mb-xl">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-lg text-center font-bold">
          How it works
        </h2>
        <div className="flex flex-col gap-lg relative">
          <div className="flex items-start gap-md relative">
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-sm font-bold">
              <span className="material-symbols-outlined">search</span>
            </div>
            <div className="pt-1">
              <h3 className="font-label-bold text-label-bold text-on-surface mb-1 font-semibold">
                Find a ride
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Search for rides going to your destination at your preferred time.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-md relative">
            <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0 shadow-sm font-bold">
              <span className="material-symbols-outlined">handshake</span>
            </div>
            <div className="pt-1">
              <h3 className="font-label-bold text-label-bold text-on-surface mb-1 font-semibold">
                Connect
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Review route details and send a request to join the journey.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-md relative">
            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 shadow-sm font-bold">
              <span className="material-symbols-outlined">commute</span>
            </div>
            <div className="pt-1">
              <h3 className="font-label-bold text-label-bold text-on-surface mb-1 font-semibold">
                Travel together
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Share the journey, split costs, and reduce traffic.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
