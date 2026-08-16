import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useApp } from '../context/AppContext';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useApp();

  const handleLogout = () => {
    setUser(prev => ({ ...prev, isAuthenticated: false }));
    navigate('/welcome');
  };

  const menuItems = [
    { label: 'Edit Profile', icon: 'edit', action: () => navigate('/profile-setup') },
    { label: 'Saved Places', icon: 'bookmark', action: () => alert('Saved Places option opened.') },
    { label: 'Safety & Report', icon: 'shield', action: () => alert('Safety & Support center.') },
    { label: 'Help Center', icon: 'help', action: () => alert('Help Center.') },
    { label: 'Settings', icon: 'settings', action: () => alert('Account Settings.') },
  ];

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="Profile" showBack={false} />

      <div className="px-container-margin py-md flex flex-col gap-lg pb-24">
        {/* User Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-lg border border-outline-variant/30 shadow-sm flex flex-col items-center text-center gap-md">
          <img
            src={user?.photo}
            alt={user?.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-md"
          />
          <div>
            <h2 className="font-headline-lg-mobile text-headline-md text-on-surface font-bold">
              {user?.name}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center justify-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-sm text-primary">call</span>
              {user?.phone}
            </p>
          </div>

          <button
            onClick={() => navigate('/profile-setup')}
            className="w-full min-h-[44px] bg-surface-container-low border border-outline-variant/40 text-on-surface font-label-bold text-body-sm rounded-xl hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Edit Profile
          </button>
        </div>

        {/* Menu Items List */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden divide-y divide-outline-variant/20">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className="w-full p-md text-left flex items-center justify-between hover:bg-surface-container-low transition-colors group"
            >
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </div>
                <span className="font-label-bold text-body-lg text-on-surface font-medium">
                  {item.label}
                </span>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform">
                chevron_right
              </span>
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full min-h-[52px] bg-error-container text-on-error-container rounded-xl font-label-bold text-headline-md font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          Logout
        </button>
      </div>
    </div>
  );
};
