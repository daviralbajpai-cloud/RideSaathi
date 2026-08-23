import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { validatePhoneNumber } from '../lib/phoneUtils';

export const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { updateUserProfile, user } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [photo, setPhoto] = useState(user?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const samplePhotos = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneError('');

    const phoneValidation = validatePhoneNumber(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    const { error } = await updateUserProfile({
      name: name.trim(),
      phone: phoneValidation.formatted,
      photo,
      isSetupComplete: true
    });
    setLoading(false);

    if (error) {
      setPhoneError(error.message || 'Failed to update profile.');
      return;
    }

    navigate('/home');
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between p-container-margin py-8">
      <div className="flex flex-col gap-6 max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="text-center mt-2">
          <h1 className="font-display-sm text-2xl font-bold tracking-tight text-on-surface">
            Set Up Your Profile
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant mt-1">
            Ensure your details are accurate for trusted carpooling.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-sm flex flex-col gap-4">
          {/* Avatar Selector */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <img
                src={photo}
                alt="Selected Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-sm"
              />
            </div>
            <span className="text-xs text-on-surface-variant font-medium">
              Select Avatar
            </span>
            <div className="flex gap-2.5">
              {samplePhotos.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPhoto(url)}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                    photo === url ? 'border-primary scale-110 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full h-[48px] px-3.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Phone Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-on-surface-variant">
                10-Digit Phone Number <span className="text-error">*</span>
              </label>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Required
              </span>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                call
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError('');
                }}
                placeholder="+91 98765 43210"
                className="w-full h-[48px] pl-10 pr-3 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1.5 leading-tight">
              🔒 Phone numbers remain private and are only shared with confirmed ride partners after request acceptance.
            </p>
            {phoneError && (
              <p className="text-error text-xs font-semibold mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {phoneError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[50px] bg-primary text-on-primary rounded-xl font-label-bold text-body-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:bg-primary/90 disabled:opacity-50 mt-2 cursor-pointer active:scale-98"
          >
            {loading ? (
              <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
            ) : (
              <>
                <span>Complete Profile & Continue</span>
                <span className="material-symbols-outlined text-base">check_circle</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
