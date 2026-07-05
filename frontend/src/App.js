import React, { Suspense, lazy } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/toaster';
import PageLoader from './components/PageLoader';

// ── Lazy-loaded layouts ────────────────────────────────────────────────────────
// Each layout chunk is only downloaded when the user first navigates to that role.
const AdminLayout  = lazy(() => import('./layouts/AdminLayout'));
const AgencyLayout = lazy(() => import('./layouts/AgencyLayout'));

// ── Lazy-loaded pages — login ─────────────────────────────────────────────────
// All 3 login types (Admin / Agency / WhatsApp Bot) are in LoginPage.jsx unchanged.
const LoginPage = lazy(() => import('./pages/LoginPage'));

// ── Lazy-loaded pages — admin ─────────────────────────────────────────────────
const AdminOverview   = lazy(() => import('./pages/admin/AdminOverview'));
const AdminAgencies   = lazy(() => import('./pages/admin/AdminAgencies'));
const AdminCampaigns  = lazy(() => import('./pages/admin/AdminCampaigns'));
const AdminUsers      = lazy(() => import('./pages/admin/AdminUsers'));
const AdminFraud      = lazy(() => import('./pages/admin/AdminFraud'));
const AdminAnalytics  = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminMediaTypes = lazy(() => import('./pages/admin/AdminMediaTypes'));

// ── Lazy-loaded pages — agency ────────────────────────────────────────────────
const AgencyOverview      = lazy(() => import('./pages/agency/AgencyOverview'));
const AgencyCampaigns     = lazy(() => import('./pages/agency/AgencyCampaigns'));
const AgencyCampaignDetail = lazy(() => import('./pages/agency/AgencyCampaignDetail'));
const AgencyTasks         = lazy(() => import('./pages/agency/AgencyTasks'));
const AgencyTeam          = lazy(() => import('./pages/agency/AgencyTeam'));
const AgencyProofs        = lazy(() => import('./pages/agency/AgencyProofs'));
const AgencyReports       = lazy(() => import('./pages/agency/AgencyReports'));
const AgencyLiveMap       = lazy(() => import('./pages/agency/AgencyLiveMap'));

// ── Lazy-loaded pages — WhatsApp bot (public) ─────────────────────────────────
const WhatsAppBot   = lazy(() => import('./pages/whatsapp/WhatsAppBot'));

// ── Lazy-loaded pages — Field capture PWA (public, mobile) ───────────────────
const CaptureProof  = lazy(() => import('./pages/capture/CaptureProof'));

// ── Role guard ────────────────────────────────────────────────────────────────
const RequireRole = ({ role, children }) => {
  const { user } = useAuth();
  if (!user)            return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/login" replace />;
  return children;
};

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          {/* Single Suspense boundary — shows PageLoader skeleton during any lazy load */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />

              {/* ── Admin portal ── */}
              <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
                <Route index              element={<AdminOverview />} />
                <Route path="agencies"    element={<AdminAgencies />} />
                <Route path="campaigns"   element={<AdminCampaigns />} />
                <Route path="users"       element={<AdminUsers />} />
                <Route path="fraud"       element={<AdminFraud />} />
                <Route path="analytics"   element={<AdminAnalytics />} />
                <Route path="media-types" element={<AdminMediaTypes />} />
              </Route>

              {/* ── Agency portal ── */}
              <Route path="/agency" element={<RequireRole role="agency"><AgencyLayout /></RequireRole>}>
                <Route index                   element={<AgencyOverview />} />
                <Route path="campaigns"        element={<AgencyCampaigns />} />
                <Route path="campaigns/:id"    element={<AgencyCampaignDetail />} />
                <Route path="tasks"            element={<AgencyTasks />} />
                <Route path="team"             element={<AgencyTeam />} />
                <Route path="proofs"           element={<AgencyProofs />} />
                <Route path="reports"          element={<AgencyReports />} />
                <Route path="live-map"         element={<AgencyLiveMap />} />
              </Route>

              {/* ── WhatsApp Bot — public ── */}
              <Route path="/whatsapp" element={<WhatsAppBot />} />

              {/* ── Field capture PWA — public, opened on field exec phone ── */}
              <Route path="/capture" element={<CaptureProof />} />

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </div>
  );
}

export default App;
