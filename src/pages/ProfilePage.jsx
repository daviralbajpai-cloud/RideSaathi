import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { validatePhoneNumber } from '../lib/phoneUtils';
import { LocationAutocomplete } from '../components/LocationAutocomplete';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser, updateUserProfile } = useApp();

  // Active modal sheet state: null | 'edit' | 'saved_places' | 'safety' | 'help' | 'settings' | 'logout_confirm'
  const [activeModal, setActiveModal] = useState(null);

  // Edit Profile form state
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editPhoto, setEditPhoto] = useState(user?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
  const [editError, setEditError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync edit state with user
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      if (user.photo) setEditPhoto(user.photo);
    }
  }, [user]);

  // Saved Places state (persisted in localStorage)
  const [savedPlaces, setSavedPlaces] = useState(() => {
    try {
      const stored = localStorage.getItem(`ridesaathi_saved_places_${user?.id || 'guest'}`);
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return [
      { id: '1', name: 'Home', address: 'Hazratganj, Lucknow', icon: 'home' },
      { id: '2', name: 'Work / Office', address: 'Gomti Nagar, Lucknow', icon: 'work' }
    ];
  });

  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceLocation, setNewPlaceLocation] = useState(null);
  const [newPlaceInput, setNewPlaceInput] = useState('');
  const [showAddPlace, setShowAddPlace] = useState(false);

  const savePlacesToStorage = (places) => {
    setSavedPlaces(places);
    try {
      localStorage.setItem(`ridesaathi_saved_places_${user?.id || 'guest'}`, JSON.stringify(places));
    } catch (_) {}
  };

  const handleAddSavedPlace = (e) => {
    e.preventDefault();
    if (!newPlaceName.trim()) return;
    const address = newPlaceLocation?.label || newPlaceInput.trim() || 'Lucknow, Uttar Pradesh';
    const newPlace = {
      id: Date.now().toString(),
      name: newPlaceName.trim(),
      address,
      icon: newPlaceName.toLowerCase().includes('home') ? 'home' : (newPlaceName.toLowerCase().includes('work') || newPlaceName.toLowerCase().includes('office') ? 'work' : 'location_on')
    };

    savePlacesToStorage([...savedPlaces, newPlace]);
    setNewPlaceName('');
    setNewPlaceLocation(null);
    setNewPlaceInput('');
    setShowAddPlace(false);
  };

  const handleDeleteSavedPlace = (id) => {
    const updated = savedPlaces.filter((p) => p.id !== id);
    savePlacesToStorage(updated);
  };

  // Safety & Report form state
  const [reportType, setReportType] = useState('Unsafe Driving');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportDescription('');
      setActiveModal(null);
    }, 2000);
  };

  // Help Center FAQ State
  const [expandedFaq, setExpandedFaq] = useState(null);
  const faqs = [
    {
      q: 'How do ride requests work?',
      a: 'When you find a ride, click "Request to Join". The driver receives your request and can accept or decline. Once accepted, the ride is confirmed.'
    },
    {
      q: 'When is my phone number shared?',
      a: 'For security and privacy, your phone number remains private until the ride offerer accepts the ride request. Once confirmed, both commuters can see each other\'s number and call.'
    },
    {
      q: 'How do I cancel a ride?',
      a: 'You can view all your active rides under the "My Activity" tab and cancel any upcoming ride or request at any time.'
    },
    {
      q: 'Is RideSaathi free to use?',
      a: 'Yes, RideSaathi provides transparent community carpooling without booking platform fees.'
    }
  ];

  // Settings State
  const [settings, setSettings] = useState({
    rideAlerts: true,
    smsReminders: true,
    privacyProtection: true
  });

  const handleToggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle Edit Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError('');

    const phoneValidation = validatePhoneNumber(editPhone);
    if (!phoneValidation.isValid) {
      setEditError(phoneValidation.error || 'Please enter a valid 10-digit phone number.');
      return;
    }

    setSavingProfile(true);
    const { error } = await updateUserProfile({
      name: editName.trim(),
      phone: phoneValidation.formatted,
      photo: editPhoto
    });
    setSavingProfile(false);

    if (error) {
      setEditError(error.message || 'Failed to update profile.');
      return;
    }

    setActiveModal(null);
  };

  // Handle Logout
  const handleLogout = async () => {
    await authService.signOut();
    setUser({
      id: null,
      name: 'Guest User',
      phone: '',
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      isAuthenticated: false,
      isSetupComplete: false
    });
    navigate('/welcome');
  };

  const samplePhotos = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
  ];

  const menuItems = [
    { id: 'edit', label: 'Edit Profile', icon: 'person', action: () => setActiveModal('edit') },
    { id: 'saved_places', label: 'Saved Places', icon: 'bookmark', action: () => setActiveModal('saved_places') },
    { id: 'safety', label: 'Safety & Emergency', icon: 'shield', action: () => setActiveModal('safety') },
    { id: 'help', label: 'Help & FAQs', icon: 'help', action: () => setActiveModal('help') },
    { id: 'settings', label: 'Settings', icon: 'settings', action: () => setActiveModal('settings') }
  ];

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="My Profile" showBack={false} />

      <div className="px-container-margin py-md flex flex-col gap-lg pb-24">
        {/* User Identity Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-sm flex flex-col items-center text-center gap-3">
          <div className="relative">
            <img
              src={user?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-sm"
            />
            {user?.isAdmin && (
              <span className="absolute -bottom-1 -right-1 bg-primary text-on-primary border border-surface p-1 rounded-full text-xs shadow-sm" title="Admin Account">
                <span className="material-symbols-outlined text-sm">verified_user</span>
              </span>
            )}
          </div>

          <div>
            <h2 className="font-headline-md text-xl font-bold text-on-surface">
              {user?.name || 'RideSaathi User'}
            </h2>

            {user?.phone && String(user.phone).trim() !== '' ? (
              <p className="text-sm text-on-surface-variant flex items-center justify-center gap-1 mt-0.5 font-medium">
                <span className="material-symbols-outlined text-sm text-primary">call</span>
                {String(user.phone).trim()}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setActiveModal('edit')}
                className="text-xs text-error font-bold flex items-center justify-center gap-1 mt-1 bg-error-container/30 px-3 py-1 rounded-xl border border-error/30 hover:bg-error-container/50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">error</span>
                Add Phone Number
              </button>
            )}
          </div>

          <button
            onClick={() => setActiveModal('edit')}
            className="w-full min-h-[42px] bg-surface-container-low border border-outline-variant/40 text-on-surface hover:text-primary font-label-bold text-xs rounded-xl hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
          >
            <span className="material-symbols-outlined text-sm text-primary">edit</span>
            Edit Profile
          </button>
        </div>

        {/* Admin Dashboard Quick Access (If Admin) */}
        {user?.isAdmin && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Admin Dashboard</h3>
                <p className="text-[11px] text-on-surface-variant font-medium">Manage rides, users & view analytics</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-label-bold text-xs shadow-sm hover:bg-primary/90 transition-colors"
            >
              Open
            </button>
          </div>
        )}

        {/* Menu Items List */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden divide-y divide-outline-variant/20">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-surface-container-low transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-outline-variant/30">
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                </div>
                <span className="text-sm font-medium text-on-surface">
                  {item.label}
                </span>
              </div>
              <span className="material-symbols-outlined text-outline text-base group-hover:translate-x-0.5 transition-transform">
                chevron_right
              </span>
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setActiveModal('logout_confirm')}
          className="w-full min-h-[48px] bg-error-container/40 text-error border border-error/30 rounded-xl font-label-bold text-xs font-bold flex items-center justify-center gap-2 hover:bg-error-container/60 transition-colors shadow-sm active:scale-98"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>Log Out</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 1. EDIT PROFILE MODAL */}
      {/* ============================================================ */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-xl border border-outline-variant/30 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">person</span>
                Edit Profile
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              {/* Photo selector */}
              <div className="flex flex-col items-center gap-2">
                <img
                  src={editPhoto}
                  alt="Profile Preview"
                  className="w-18 h-18 rounded-full object-cover border-2 border-primary shadow-sm"
                />
                <span className="text-xs text-on-surface-variant font-medium">Select Avatar:</span>
                <div className="flex gap-2">
                  {samplePhotos.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditPhoto(url)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        editPhoto === url ? 'border-primary scale-110 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full h-[46px] px-3.5 rounded-xl border border-outline-variant/50 bg-surface font-body-lg text-on-surface text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-on-surface-variant">
                    10-Digit Phone Number <span className="text-error">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Required
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => {
                    setEditPhone(e.target.value);
                    if (editError) setEditError('');
                  }}
                  placeholder="+91 98765 43210"
                  className="w-full h-[46px] px-3.5 rounded-xl border border-outline-variant/50 bg-surface font-body-lg text-on-surface text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  🔒 Shared with confirmed ride partners only after request acceptance.
                </p>
                {editError && (
                  <p className="text-error text-xs font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {editError}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant font-label-bold text-xs hover:bg-surface-container-highest transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-label-bold text-xs hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. SAVED PLACES MODAL */}
      {/* ============================================================ */}
      {activeModal === 'saved_places' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-xl border border-outline-variant/30 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">bookmark</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-sm font-bold text-on-surface">Saved Places</h3>
                  <p className="text-[11px] text-on-surface-variant">Frequently used addresses</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setShowAddPlace(false);
                }}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* List of saved places */}
            <div className="flex flex-col gap-2">
              {savedPlaces.map((place) => (
                <div
                  key={place.id}
                  className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-base">{place.icon || 'location_on'}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-on-surface truncate">{place.name}</h4>
                      <p className="text-[11px] text-on-surface-variant truncate font-medium">{place.address}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSavedPlace(place.id)}
                    className="w-8 h-8 rounded-lg text-outline hover:text-error hover:bg-error/10 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                    title="Remove place"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Place Section */}
            {showAddPlace ? (
              <form onSubmit={handleAddSavedPlace} className="bg-surface-container-high p-4 rounded-2xl flex flex-col gap-3 border border-outline-variant/40 mt-1">
                <h4 className="text-xs font-bold text-on-surface">Add New Place</h4>
                <input
                  type="text"
                  required
                  placeholder="Place Name (e.g. Home, Office, Gym)"
                  value={newPlaceName}
                  onChange={(e) => setNewPlaceName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-outline-variant/50 bg-surface font-body-sm text-on-surface text-xs outline-none"
                />
                <LocationAutocomplete
                  id="saved-place-search"
                  label="Search Area / Landmark"
                  placeholder="e.g. Gomti Nagar, Lucknow"
                  value={newPlaceInput}
                  onChange={setNewPlaceInput}
                  onSelect={(loc) => {
                    setNewPlaceLocation(loc);
                    if (loc) setNewPlaceInput(loc.label);
                  }}
                  variant="primary"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddPlace(false)}
                    className="flex-1 py-2 rounded-xl bg-surface-container text-on-surface font-label-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-primary text-on-primary font-label-bold text-xs shadow-sm cursor-pointer"
                  >
                    Save Place
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddPlace(true)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-outline-variant/60 text-primary font-label-bold text-xs flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add_location_alt</span>
                <span>Add New Place</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. SAFETY & REPORT MODAL */}
      {/* ============================================================ */}
      {activeModal === 'safety' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-xl border border-outline-variant/30 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">shield</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-sm font-bold text-on-surface">Safety & Emergency SOS</h3>
                  <p className="text-[11px] text-on-surface-variant">Emergency helplines & incident reporting</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Quick Emergency Helplines */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Emergency Helplines</span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:112"
                  className="bg-error-container/40 border border-error/30 p-2.5 rounded-xl flex items-center gap-2 text-error font-label-bold text-xs hover:bg-error-container/60 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">local_police</span>
                  <div>
                    <span className="block text-[10px] opacity-80">Police SOS</span>
                    <span className="text-xs font-bold">112</span>
                  </div>
                </a>
                <a
                  href="tel:1090"
                  className="bg-primary/10 border border-primary/30 p-2.5 rounded-xl flex items-center gap-2 text-primary font-label-bold text-xs hover:bg-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">support_agent</span>
                  <div>
                    <span className="block text-[10px] opacity-80">Women Power</span>
                    <span className="text-xs font-bold">1090</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Report an Incident Form */}
            <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/30 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">report</span>
                Report an Issue / Unsafe Behavior
              </span>

              {reportSubmitted ? (
                <div className="bg-primary/10 text-primary border border-primary/20 p-3 rounded-xl text-center text-xs font-semibold">
                  ✓ Incident report logged. Support team will review immediately.
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="flex flex-col gap-2.5">
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-xs outline-none"
                  >
                    <option value="Unsafe Driving">Unsafe Driving / Speeding</option>
                    <option value="Fake Profile">Fake Profile / Wrong Car Info</option>
                    <option value="Harassment">Inappropriate Conduct</option>
                    <option value="Pricing Dispute">Fare / Payment Dispute</option>
                    <option value="Other">Other Safety Concern</option>
                  </select>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the incident (e.g. route, date, time)..."
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface text-xs outline-none resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-error text-on-error font-label-bold text-xs hover:bg-error/90 transition-colors shadow-sm cursor-pointer"
                  >
                    Submit Incident Report
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. HELP CENTER MODAL */}
      {/* ============================================================ */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-xl border border-outline-variant/30 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">help</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-sm font-bold text-on-surface">Help & FAQs</h3>
                  <p className="text-[11px] text-on-surface-variant">Common guidance & support contacts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* FAQs Accordion */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Top Questions</span>
              {faqs.map((faq, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <div key={index} className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : index)}
                      className="w-full p-3 text-left font-label-bold text-xs font-bold text-on-surface flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span className={`material-symbols-outlined text-outline text-base transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 text-xs text-on-surface-variant border-t border-outline-variant/15 pt-2 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Direct Support Contacts */}
            <div className="bg-surface-container p-3.5 rounded-2xl flex flex-col gap-1.5 border border-outline-variant/40">
              <span className="text-xs font-bold text-on-surface">Need Direct Support?</span>
              <p className="text-[11px] text-on-surface-variant">Reach out directly to our platform desk:</p>
              <div className="flex items-center gap-2 text-xs text-primary font-bold mt-1">
                <span className="material-symbols-outlined text-base">mail</span>
                <a href="mailto:daviralbajpai@gmail.com" className="hover:underline">daviralbajpai@gmail.com</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. SETTINGS MODAL */}
      {/* ============================================================ */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-xl border border-outline-variant/30 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">settings</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-sm font-bold text-on-surface">Settings</h3>
                  <p className="text-[11px] text-on-surface-variant">Notifications & privacy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 divide-y divide-outline-variant/20">
              {/* Ride Alerts Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs font-bold text-on-surface block">Ride Alerts</span>
                  <span className="text-[11px] text-on-surface-variant">Instant alerts when a commuter requests to join</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.rideAlerts}
                  onChange={() => handleToggleSetting('rideAlerts')}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </div>

              {/* SMS Reminders Toggle */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <span className="text-xs font-bold text-on-surface block">Departure Reminders</span>
                  <span className="text-[11px] text-on-surface-variant">Reminders 30 mins before scheduled trip</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.smsReminders}
                  onChange={() => handleToggleSetting('smsReminders')}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </div>

              {/* Privacy Protection Toggle */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <span className="text-xs font-bold text-on-surface block">Phone Number Privacy</span>
                  <span className="text-[11px] text-on-surface-variant">Reveal number only upon confirmed acceptance</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacyProtection}
                  onChange={() => handleToggleSetting('privacyProtection')}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary font-label-bold text-xs shadow-sm hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. LOGOUT CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {activeModal === 'logout_confirm' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-sm w-full shadow-xl border border-outline-variant/30 flex flex-col gap-4 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-error-container/40 border border-error/30 text-error flex items-center justify-center mx-auto text-2xl">
              <span className="material-symbols-outlined">logout</span>
            </div>
            <div>
              <h3 className="font-headline-md text-base font-bold text-on-surface">Log Out?</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Are you sure you want to log out of your RideSaathi account?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant font-label-bold text-xs hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-error text-on-error font-label-bold text-xs hover:bg-error/90 transition-colors shadow-sm cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
