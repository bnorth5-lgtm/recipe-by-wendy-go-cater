import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { BrandingInjector } from "./components/BrandingInjector"; // Import BrandingInjector
import "./i18n"; // Import i18n configuration

// Import your page components
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Import new sub-page components
import Ingredients from "./pages/menu/Ingredients.tsx";
import Recipes from "./pages/menu/Recipes.tsx";
import Menus from "./pages/menu/Menus.tsx";
import Inventory from "./pages/menu/Inventory.tsx";
import PrepSchedule from "./pages/menu/PrepSchedule.tsx"; // NEW Import

import Clients from "./pages/quoting/Clients.tsx";
import Proposals from "./pages/quoting/Proposals.tsx";
import Estimates from "./pages/quoting/Estimates.tsx"; // Changed from Quotes

import Calendar from "./pages/events/Calendar.tsx";
import Bookings from "./pages/events/Bookings.tsx";
import BEOs from "./pages/events/BEOs.tsx";

import GeneralSettings from "./pages/settings/General.tsx";
import UsersSettings from "./pages/settings/Users.tsx";
import BrandingSettings from "./pages/settings/Branding.tsx";
import CateringAverages from "./pages/settings/CateringAverages.tsx";
import SubscriptionSettings from "./pages/settings/Subscription.tsx";
import PricingEngine from "./pages/settings/PricingEngine.tsx";
import MarketExpansion from "./pages/settings/MarketExpansion.tsx";
import LegalEquity from "./pages/settings/LegalEquity.tsx";
import EducationalBank from "./pages/EducationalBank.tsx";
import MarketIntelligence from "./pages/MarketIntelligence.tsx"; // NEW Import
import { lazy, Suspense } from "react";
const VenueArchitect = lazy(() => {
  if (typeof window === 'undefined') {
    return Promise.resolve({ default: () => null });
  }
  return import("./components/VenueMap/VenueArchitect.tsx").then(m => ({ default: m.VenueArchitect }));
});
import LiveStory from "./pages/LiveStory.tsx";
import BEOGenerator from "./pages/logistics/BEOGenerator.tsx";
import ExecutiveFeed from "./pages/ExecutiveFeed.tsx";
import ClientPortal from "./pages/portal/ClientPortal.tsx";
import { CrewPortal } from "./pages/portal/CrewPortal.tsx";
import { ChefView } from "./pages/portal/ChefView.tsx";
import { ClientQuote } from "./pages/portal/ClientQuote.tsx";
import SignBEO from "./pages/public/SignBEO.tsx";
import Welcome from "./pages/public/Welcome.tsx"; // NEW Import
import { Onboarding } from "./pages/Onboarding.tsx";

import { EventProvider } from "./context/EventContext";
import { BrandProvider } from "./context/BrandContext";
import { Toaster } from "sonner";

// ── App shell (authenticated, with sidebar + bottom nav) ─────────────────────

function AppShell() {
  return (
    <BrandProvider>
      <EventProvider>
        <Layout>
          <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/notes/:noteId" element={<Dashboard />} /> {/* NEW: Route for individual notes */}

        {/* Menu & Recipes Routes (now direct) */}
        {/* Removed /menu top-level route */}
        <Route path="/menu/inventory" element={<Inventory />} />
        <Route path="/menu/ingredients" element={<Ingredients />} />
        <Route path="/menu/recipes" element={<Recipes />} />
        <Route path="/menu/menus" element={<Menus />} />
        <Route path="/menu/schedule" element={<PrepSchedule />} /> {/* NEW Route */}

        {/* Quoting & Proposals Routes with optional ID for drill-down */}
        <Route path="/quoting" element={<Navigate to="/quoting/clients" replace />} />
        <Route path="/quoting/clients" element={<Clients />} />
        <Route path="/quoting/proposals" element={<Proposals />} />
        <Route path="/quoting/proposals/:proposalId" element={<Proposals />} /> {/* Added optional ID */}
        <Route path="/quoting/estimates" element={<Estimates />} /> {/* Changed from Quotes */}
        <Route path="/quoting/estimates/:estimateId" element={<Estimates />} /> {/* Changed from Quotes */}

        {/* Events & Planning Routes with optional ID for drill-down */}
        <Route path="/events" element={<Navigate to="/events/calendar" replace />} />
        <Route path="/events/calendar" element={<Calendar />} />
        <Route path="/events/calendar/:bookingId" element={<Calendar />} /> {/* Added optional ID */}
        <Route path="/events/bookings" element={<Bookings />} />
        <Route path="/events/beos" element={<BEOs />} />
        <Route path="/events/beos/:bookingId" element={<BEOs />} /> {/* Added optional ID */}

        {/* Settings Routes */}
        <Route path="/settings" element={<Navigate to="/settings/general" replace />} />
        <Route path="/settings/general" element={<GeneralSettings />} />
        <Route path="/settings/users" element={<UsersSettings />} />
        <Route path="/settings/branding" element={<BrandingSettings />} />
        <Route path="/settings/catering-averages" element={<CateringAverages />} />
        <Route path="/settings/subscription" element={<SubscriptionSettings />} />
        <Route path="/settings/pricing-engine" element={<PricingEngine />} />
        <Route path="/settings/market-expansion" element={<MarketExpansion />} />
        <Route path="/settings/legal-equity" element={<LegalEquity />} />

        <Route path="/educational-bank" element={<EducationalBank />} />
        <Route path="/market-pulse" element={<MarketIntelligence />} />
        <Route path="/logistics/beo-generator" element={<BEOGenerator />} />
        <Route path="/venue-architect" element={
          <Suspense fallback={<div className="flex h-full items-center justify-center bg-slate-950 text-[#fbbf24] font-bold">Initializing Architect Engine...</div>}>
            <VenueArchitect />
          </Suspense>
        } />

        <Route path="/live-story" element={<LiveStory />} />
        <Route path="/executive" element={<ExecutiveFeed />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      </EventProvider>
    </BrandProvider>
  );
}

// ── Root router ───────────────────────────────────────────────────────────────

const App = () => {
  console.log("App.tsx is rendering!"); // Diagnostic log

  return (
    <BrowserRouter>
      <BrandingInjector /> {/* Add BrandingInjector here */}
      <Toaster position="top-right" />
      <ErrorBoundary>
        <Routes>
          {/*
           * Client Portal — fully public, no sidebar/bottom nav.
           * Must be declared BEFORE the catch-all AppShell route.
           */}
          <Route path="/portal/:proposalId" element={<ClientPortal />} />
          
          {/*
           * Client Quote View — High-end client presentation
           */}
          <Route path="/quote/:eventId" element={<ClientQuote />} />

          {/*
           * Chef View — Kitchen Sync
           */}
          <Route path="/chef/:eventId" element={<ChefView />} />

          {/*
           * Crew Portal — Worker-view HUD
           */}
          <Route path="/crew/:eventId" element={<CrewPortal />} />

          {/*
           * Welcome Page — Landing page for the app
           */}
          <Route path="/welcome" element={<Welcome />} />

          {/*
           * Onboarding Wizard — SaaS setup
           */}
          <Route 
            path="/onboarding" 
            element={
              <BrandProvider>
                <Onboarding />
              </BrandProvider>
            } 
          />

          {/*
           * SignBEO — lightweight public signing page.
           * No sidebar, no auth. Client receives a link like /sign/<uuid>.
           */}
          <Route path="/sign/:eventId" element={<SignBEO />} />

          {/* Everything else uses the full authenticated app shell */}
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;