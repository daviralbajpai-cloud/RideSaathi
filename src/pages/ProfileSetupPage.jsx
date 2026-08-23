import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { validatePhoneNumber } from '../lib/phoneUtils';
import { DEFAULT_AVATAR, PRESET_AVATARS, processImageFile } from '../lib/imageUtils';

export const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { updateUserProfile, user } = useApp();

  const fileInputRef = useRef(null);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [photo, setPhoto] = useState(user?.photo || DEFAULT_AVATAR);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setPhoneError('');
    const { dataUrl, error } = await processImageFile(file);
    setUploadingPhoto(false);
    if (error) {
      setPhoneError(error);
      return;
    }
    if (dataUrl) {
      setPhoto(dataUrl);
    }
  };

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
          {/* Avatar Selector with Camera Upload */}
          <div className="flex flex-col items-center gap-3 bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/30">
            <div className="relative group">
              <img
                src={photo || DEFAULT_AVATAR}
                alt="Selected Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/30 shadow-md transition-all"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-all border-2 border-surface cursor-pointer"
                title="Upload custom photo"
              >
                <span className="material-symbols-outlined text-base">photo_camera</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">
                  {uploadingPhoto ? 'progress_activity' : 'cloud_upload'}
                </span>
                <span>{uploadingPhoto ? 'Processing...' : 'Upload Photo'}</span>
              </button>
              {photo !== DEFAULT_AVATAR && (
                <button
                  type="button"
                  onClick={() => setPhoto(DEFAULT_AVATAR)}
                  className="px-3 py-1.5 rounded-xl bg-surface-container text-on-surface-variant text-xs font-medium hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/40"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="flex flex-col items-center gap-1.5 pt-1 border-t border-outline-variant/20 w-full">
              <span className="text-[11px] text-on-surface-variant font-medium">
                Or select an avatar:
              </span>
              <div className="flex gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setPhoto(url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                      photo === url ? 'border-primary scale-110 shadow-sm ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
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
