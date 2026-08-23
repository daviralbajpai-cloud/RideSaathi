import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';

export const NoResultsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="Search Results" showBack={true} />

      <div className="flex-1 flex flex-col items-center justify-center text-center px-container-margin py-xl gap-lg my-auto">
        {/* Illustration Icon */}
        <div className="w-28 h-28 rounded-full bg-surface-container-low flex items-center justify-center shadow-inner border border-outline-variant/30 text-outline">
          <span className="material-symbols-outlined text-[64px]">search_off</span>
        </div>

        {/* Text Content */}
        <div className="space-y-2 max-w-sm">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
            No suitable carpool found.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            No commuters are currently driving along this route for your selected time. Try changing your search filters or offer a ride yourself.
          </p>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3 max-w-sm pt-md">
          {/* Primary Action: Edit Search */}
          <button
            onClick={() => navigate('/find-ride')}
            className="w-full min-h-[52px] rounded-xl bg-primary text-on-primary font-label-bold text-label-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
            Edit Search Filters
          </button>

          {/* Secondary Action: Offer a Ride */}
          <button
            onClick={() => navigate('/offer-ride')}
            className="w-full min-h-[52px] rounded-xl bg-secondary text-on-secondary font-label-bold text-label-bold flex items-center justify-center gap-2 hover:bg-secondary/90 transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Offer a Ride Instead
          </button>
        </div>
      </div>
    </div>
  );
};
