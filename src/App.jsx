import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/AppLayout';

import { WelcomePage } from './pages/WelcomePage';
import { SignInPage } from './pages/SignInPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { HomePage } from './pages/HomePage';
import { FindRidePage } from './pages/FindRidePage';
import { AvailableRidesPage } from './pages/AvailableRidesPage';
import { NoResultsPage } from './pages/NoResultsPage';
import { RideDetailsPage } from './pages/RideDetailsPage';
import { RideRequestPage } from './pages/RideRequestPage';
import { OfferRidePage } from './pages/OfferRidePage';
import { SmartRoutePage } from './pages/SmartRoutePage';
import { RecurringRidesPage } from './pages/RecurringRidesPage';
import { ActivityPage } from './pages/ActivityPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/welcome" replace />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/profile-setup" element={<ProfileSetupPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/find-ride" element={<FindRidePage />} />
            <Route path="/available-rides" element={<AvailableRidesPage />} />
            <Route path="/no-results" element={<NoResultsPage />} />
            <Route path="/ride-details/:id" element={<RideDetailsPage />} />
            <Route path="/ride-request/:id" element={<RideRequestPage />} />
            <Route path="/offer-ride" element={<OfferRidePage />} />
            <Route path="/smart-route" element={<SmartRoutePage />} />
            <Route path="/recurring-rides" element={<RecurringRidesPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
