import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import AgencyLayout from './layouts/AgencyLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminAgencies from './pages/admin/AdminAgencies';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminUsers from './pages/admin/AdminUsers';
import AdminFraud from './pages/admin/AdminFraud';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminBilling from './pages/admin/AdminBilling';
import AdminMediaTypes from './pages/admin/AdminMediaTypes';
import AgencyOverview from './pages/agency/AgencyOverview';
import AgencyCampaigns from './pages/agency/AgencyCampaigns';
import AgencyTasks from './pages/agency/AgencyTasks';
import AgencyTeam from './pages/agency/AgencyTeam';
import AgencyProofs from './pages/agency/AgencyProofs';
import AgencyReports from './pages/agency/AgencyReports';
import AgencyLiveMap from './pages/agency/AgencyLiveMap';
import WhatsAppBot from './pages/whatsapp/WhatsAppBot';
import { Toaster } from './components/ui/toaster';

const RequireRole = ({ role, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Admin */}
            <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
              <Route index element={<AdminOverview />} />
              <Route path="agencies" element={<AdminAgencies />} />
              <Route path="campaigns" element={<AdminCampaigns />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="fraud" element={<AdminFraud />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="billing" element={<AdminBilling />} />
              <Route path="media-types" element={<AdminMediaTypes />} />
            </Route>

            {/* Agency */}
            <Route path="/agency" element={<RequireRole role="agency"><AgencyLayout /></RequireRole>}>
              <Route index element={<AgencyOverview />} />
              <Route path="campaigns" element={<AgencyCampaigns />} />
              <Route path="tasks" element={<AgencyTasks />} />
              <Route path="team" element={<AgencyTeam />} />
              <Route path="proofs" element={<AgencyProofs />} />
              <Route path="reports" element={<AgencyReports />} />
              <Route path="live-map" element={<AgencyLiveMap />} />
            </Route>

            {/* WhatsApp Bot */}
            <Route path="/whatsapp" element={<WhatsAppBot />} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </div>
  );
}

export default App;
