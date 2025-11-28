import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { BrandingInjector } from "./components/BrandingInjector"; // Import BrandingInjector

// Import your page components
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Import new sub-page components
import Ingredients from "./pages/menu/Ingredients.tsx";
import Recipes from "./pages/menu/Recipes.tsx";
import Menus from "./pages/menu/Menus.tsx";
import Inventory from "./pages/menu/Inventory.tsx";

import Clients from "./pages/quoting/Clients.tsx";
import Proposals from "./pages/quoting/Proposals.tsx";
import Estimates from "./pages/quoting/Estimates.tsx";

import Calendar from "./pages/events/Calendar.tsx";
import Bookings from "./pages/events/Bookings.tsx";
import BEOs from "./pages/events/BEOs.tsx";

import GeneralSettings from "./pages/settings/General.tsx";
import UsersSettings from "./pages/settings/Users.tsx";
import BrandingSettings from "./pages/settings/Branding.tsx";
import CateringAverages from "./pages/settings/CateringAverages.tsx";

const App = () => {
  console.log("App.tsx is rendering!"); // Diagnostic log

  return (
    <BrowserRouter>
      <BrandingInjector /> {/* Add BrandingInjector here */}
      <ErrorBoundary>
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

            {/* Quoting & Proposals Routes with optional ID for drill-down */}
            <Route path="/quoting" element={<Navigate to="/quoting/clients" replace />} />
            <Route path="/quoting/clients" element={<Clients />} />
            <Route path="/quoting/proposals" element={<Proposals />} />
            <Route path="/quoting/proposals/:proposalId" element={<Proposals />} /> {/* Added optional ID */}
            <Route path="/quoting/estimates" element={<Estimates />} />
            <Route path="/quoting/estimates/:estimateId" element={<Estimates />} /> {/* Added optional ID */}

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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;