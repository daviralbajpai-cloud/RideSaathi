import React from 'react';
import { BottomNav } from './BottomNav';

export const AppLayout = ({ children }) => {
  return (
    <div className="w-full min-h-screen bg-surface-dim/20 flex flex-col items-center justify-start">
      <div className="w-full max-w-[600px] min-h-screen bg-background text-on-background flex flex-col relative shadow-xl">
        <main className="flex-1 flex flex-col pb-24">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
};
