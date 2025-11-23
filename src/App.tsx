import { Layout } from "./components/layout/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

const App = () => {
  console.log("App component rendering"); // Debugging log
  return (
    <ErrorBoundary>
      <Layout>
        <div className="p-4 text-center text-2xl font-bold text-red-700">
          If you see this, Layout and ErrorBoundary are working!
        </div>
      </Layout>
    </ErrorBoundary>
  );
};

export default App;