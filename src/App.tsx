import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import ErrorBoundary from "./components/ErrorBoundary"; // Import the new ErrorBoundary

// Import your page components
import Dashboard from "./pages/Dashboard";
import MenuManagement from "./pages/MenuManagement";
import QuotingGenerator from "./pages/QuotingGenerator";
import EventsPlanning from "./pages/EventsPlanning";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index"; // Keep Index for now, but it will redirect

const App = () => (
  <BrowserRouter>
    <ErrorBoundary> {/* Wrap the entire application with ErrorBoundary */}
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

export default App;