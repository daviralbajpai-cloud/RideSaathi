import React from 'react';
import { useNavigate } from 'react-router-dom'; // Wait, let's use 'react-router-dom'!
import { TopBar } from '../components/TopBar';

export const SmartRoutePage = () => {
  const navigate = useNavigate();

  const smartMatch = {
    personName: "Priya Patel",
    personPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    yourRoute: "Hazratganj → Gomti Nagar IT Park",
    theirRoute: "Hazratganj → Alambagh → Gomti Nagar",
    overlapSegment: "Hazratganj to Gomti Nagar Bypass",
    time: "08:30 AM"
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <TopBar title="Smart Route Connection" showBack={true} />

      <div className="px-container-margin py-md flex flex-col gap-lg pb-24">
        {/* Banner Alert */}
        <div className="bg-tertiary-container/15 border border-tertiary-container/40 p-md rounded-2xl flex items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-2xl">alt_route</span>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Route Overlap Detected
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Your routes overlap. You may be able to travel together.
            </p>
          </div>
        </div>

        {/* Visual Map Overlap Diagram */}
        <div className="w-full h-52 rounded-2xl bg-surface-container-high border border-outline-variant/30 relative overflow-hidden flex flex-col justify-between p-md shadow-sm">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#004ac6_1.5px,transparent_1.5px)] [background-size:18px_18px]"></div>

          {/* Top Tag */}
          <div className="z-10 self-start bg-surface/90 backdrop-blur-md rounded-full px-3 py-1 text-[12px] font-label-bold text-on-surface border border-outline-variant/30 flex items-center gap-1.5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
            <span>Overlapping Commute Segment</span>
          </div>

          {/* Route Connection Hub */}
          <div className="z-10 bg-surface rounded-xl p-3 shadow-md border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={smartMatch.personPhoto}
                alt={smartMatch.personName}
                className="w-11 h-11 rounded-full object-cover border-2 border-primary/20"
              />
              <div>
                <p className="font-headline-md text-headline-md text-on-surface font-bold leading-tight">
                  {smartMatch.personName}
                </p>
                <p className="font-body-sm text-[12px] text-on-surface-variant">
                  Person offering ride along segment
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
              Matches Route
            </span>
          </div>
        </div>

        {/* Overlap Breakdown details */}
        <div className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/30 shadow-sm flex flex-col gap-md">
          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold border-b border-outline-variant/20 pb-2">
            Route Comparison
          </h3>

          <div className="flex flex-col gap-sm">
            <div className="bg-surface-container-low p-3 rounded-xl">
              <span className="font-label-bold text-[11px] text-outline uppercase block mb-1">Your Route</span>
              <p className="font-body-lg text-body-lg font-bold text-on-surface">
                {smartMatch.yourRoute}
              </p>
            </div>

            <div className="bg-surface-container-low p-3 rounded-xl">
              <span className="font-label-bold text-[11px] text-outline uppercase block mb-1">Priya's Extended Route</span>
              <p className="font-body-lg text-body-lg font-bold text-on-surface">
                {smartMatch.theirRoute}
              </p>
            </div>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Smart Route analysis identified that 80% of your travel path overlaps with Priya's route during the morning commute window ({smartMatch.time}).
          </p>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => navigate('/available-rides')}
          className="w-full min-h-[52px] bg-primary text-on-primary rounded-xl font-headline-md text-headline-md font-bold shadow-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-auto"
        >
          <span>View Connection</span>
          <span className="material-symbols-outlined text-2xl">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
