import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, theme as antTheme, message } from 'antd';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { AppHeader } from './components/AppHeader';
import { SideNav } from './components/SideNav';
import { lightTheme, darkTheme } from './styles/theme';
import { useWallet } from './hooks/useWallet';
import { initializeContract, getContract, getQuadraticContract } from './services/contractService';

// Pages
import { Dashboard } from './pages/Dashboard';
import { VotingList } from './pages/VotingList';
import { VotePage } from './pages/VotePage';
import { CreateVoting } from './pages/CreateVoting';
import { Results } from './pages/Results';
import { AdminDashboard } from './pages/AdminDashboard';

const { Content } = Layout;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { wallet, connect, disconnect } = useWallet();
  const [contractInitialized, setContractInitialized] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Initialize contract when wallet connects
  useEffect(() => {
    if (wallet && !contractInitialized) {
      initializeContract()
        .then(() => {
          setContractInitialized(true);
          console.log('Contract initialized successfully');
        })
        .catch(error => {
          console.error('Failed to initialize contract:', error);
          message.error('Failed to connect to smart contract');
        });
    }
  }, [wallet, contractInitialized]);

  // Polling invalidation（避免使用 eth_newFilter，以兼容受限 RPC）
  useEffect(() => {
    if (!contractInitialized) return;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-votings-onchain'] });
      queryClient.invalidateQueries({ queryKey: ['voting-onchain'] });
      queryClient.invalidateQueries({ queryKey: ['results-onchain'] });
    };
    const t = setInterval(invalidate, 20000); // 20s 轻量轮询
    return () => clearInterval(t);
  }, [contractInitialized, queryClient]);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Check if user is admin (you can modify this logic)
  const isAdmin = wallet?.address?.toLowerCase() === '0xc2de6f6d1f3c6a5169c8cee0d7f1de68f96c28dd';

  return (
    <ConfigProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <AppHeader
            wallet={wallet}
            isDarkMode={isDarkMode}
            onThemeToggle={handleThemeToggle}
            onConnect={connect}
            onDisconnect={disconnect}
            isAdmin={isAdmin}
          />
          <Layout>
            <SideNav 
              collapsed={sidebarCollapsed}
              onCollapse={setSidebarCollapsed}
              isAdmin={isAdmin}
            />
            <Content style={{ 
              marginLeft: sidebarCollapsed ? 80 : 200,
              padding: 24,
              transition: 'all 0.2s',
              background: isDarkMode ? '#0B0F14' : '#F9FAFB',
            }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/votings" element={<VotingList />} />
                <Route path="/vote/:id" element={<VotePage />} />
                <Route path="/vote/:source/:id" element={<VotePage />} />
                <Route path="/results/:id" element={<Results />} />
                <Route path="/results/:source/:id" element={<Results />} />
                <Route path="/admin/create" element={<CreateVoting />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
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
