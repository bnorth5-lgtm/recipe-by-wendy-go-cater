import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

// Import your page components
import Dashboard from "./pages/Dashboard";
import MenuManagement from "./pages/MenuManagement";
import QuotingGenerator from "./pages/QuotingGenerator";
import EventsPlanning from "./pages/EventsPlanning";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const App = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        {/* TEMPORARY TEST ELEMENT: If you see this purple bar, App is rendering! */}
        <div className="bg-purple-500 text-white p-4 text-center text-2xl font-bold">
          APP COMPONENT IS RENDERING!
        </div>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/menu" element={<MenuManagement />} />
            <Route path="/quoting" element={<QuotingGenerator />} />
            <Route path="/events" element={<EventsPlanning />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;