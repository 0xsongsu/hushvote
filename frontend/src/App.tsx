import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Spin } from 'antd';

// Pages - Landing page loaded immediately, DApp lazy loaded
import { LandingPage } from './pages/LandingPage';

// Lazy load entire DApp component to avoid loading blockchain libraries
const DAppRoutes = lazy(() => import('./components/DAppRoutes'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#0B0F14',
  }}>
    <Spin size="large" />
  </div>
);

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Landing Page Route - No blockchain dependencies */}
        <Route path="/" element={<LandingPage />} />

        {/* DApp Routes - Lazy loaded with all blockchain dependencies */}
        <Route
          path="/*"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <DAppRoutes />
            </Suspense>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
