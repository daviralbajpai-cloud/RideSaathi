import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [photo, setPhoto] = useState(user?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');

  const samplePhotos = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setUser({
      ...user,
      name,
      phone,
      photo,
      isSetupComplete: true
    });
    navigate('/home');
  };

  return (
    <div className="w-full flex-1 flex flex-col px-container-margin py-lg max-w-[600px] mx-auto">
      {/* Header */}
      <div className="mb-lg">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
          Complete Your Profile
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Set up your profile so fellow commuters know who they're traveling with.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-lg">
        {/* Photo Selection */}
        <div className="flex flex-col items-center gap-md bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm">
          <div className="relative">
            <img
              src={photo}
              alt="Profile avatar preview"
              className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-md"
            />
            <div className="absolute bottom-0 right-0 bg-primary text-on-primary p-1.5 rounded-full shadow">
              <span className="material-symbols-outlined text-sm">photo_camera</span>
            </div>
          </div>

          <div className="flex gap-3">
            {samplePhotos.map((url, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPhoto(url)}
                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                  photo === url ? 'border-primary scale-110 shadow-sm' : 'border-transparent opacity-70'
                }`}
              >
                <img src={url} alt={`Avatar option ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Form Inputs */}
        <div className="flex flex-col gap-md">
          {/* Full Name */}
          <div>
            <label htmlFor="full-name" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
              Full Name
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                person
              </span>
              <input
                id="full-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full h-[52px] pl-10 pr-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-lg text-on-surface outline-none transition-all"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phone-number" className="block font-label-bold text-label-bold text-on-surface-variant mb-1 ml-1">
              Phone Number
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                call
              </span>
              <input
                id="phone-number"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-[52px] pl-10 pr-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-lg text-on-surface outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="mt-auto pt-md">
          <button
            type="submit"
            className="w-full min-h-[52px] bg-primary text-on-primary rounded-xl font-label-bold text-label-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span>Save & Continue</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  );
};
