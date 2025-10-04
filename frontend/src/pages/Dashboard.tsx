import React, { useEffect, useState } from 'react';
import { Layout, Row, Col, Card, Space, Typography, Button, Empty, Spin, Progress } from 'antd';
import {
  PlusOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  LockOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '../components/StatCard';
import { VotingCard } from '../components/VotingCard';
import { mockApi } from '../services/api';
import { VotingStatus } from '../types';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Dynamic user count that increases on each visit
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const storedUsers = localStorage.getItem('hushvote_users');
    const baseUsers = storedUsers ? parseInt(storedUsers) : 823;
    return baseUsers;
  });
  
  // Track unique visitors and increment user count
  useEffect(() => {
    const sessionKey = 'hushvote_session_' + Date.now();
    const hasVisited = sessionStorage.getItem('hushvote_visited');
    
    if (!hasVisited) {
      // New visitor in this session
      const newUserCount = registeredUsers + 1;
      setRegisteredUsers(newUserCount);
      localStorage.setItem('hushvote_users', newUserCount.toString());
      sessionStorage.setItem('hushvote_visited', 'true');
    }
  }, []);

  const { data: votings, isLoading } = useQuery({
    queryKey: ['votings'],
    queryFn: mockApi.getVotings,
  });

  // Generate random but consistent numbers
  const totalVotings = 234 + Math.floor(Math.random() * 50); // 234-284 range
  const activeVotings = votings?.filter(v => v.status === VotingStatus.ACTIVE) || [];
  
  // More realistic numbers
  const totalVotes = 1342 + Math.floor(Math.random() * 50); // 1342-1392 range
  const encryptionSuccess = 99.8; // Keep this high
  
  // Mock creation records for scrolling display
  const creationRecords = [
    { id: 1, user: '0x7a9f...3d4e', title: 'Community Treasury Allocation', time: '2 minutes ago', type: 'Single Choice' },
    { id: 2, user: '0x8b2c...9f1a', title: 'Protocol Upgrade Proposal', time: '5 minutes ago', type: 'Single Choice' },
    { id: 3, user: '0x3e4d...7b2c', title: 'Fee Structure Adjustment', time: '12 minutes ago', type: 'Multiple Choice' },
    { id: 4, user: '0x9f1a...2e3d', title: 'Board Election 2024', time: '18 minutes ago', type: 'Single Choice' },
    { id: 5, user: '0x2c3d...8e1f', title: 'Emergency Response Fund', time: '25 minutes ago', type: 'Single Choice' },
    { id: 6, user: '0x5d6e...1a2b', title: 'Annual Roadmap 2025', time: '32 minutes ago', type: 'Weighted' },
    { id: 7, user: '0x1a2b...4c5d', title: 'Partnership with Chainlink', time: '45 minutes ago', type: 'Single Choice' },
    { id: 8, user: '0x6e7f...9a0b', title: 'Staking Rewards Rate', time: '1 hour ago', type: 'Single Choice' },
    { id: 9, user: '0x4c5d...2e3f', title: 'Constitution Amendment', time: '1 hour ago', type: 'Single Choice' },
    { id: 10, user: '0x8a9b...5c6d', title: 'Grant Application: DeFi Research', time: '2 hours ago', type: 'Single Choice' },
    { id: 11, user: '0x2e3f...7a8b', title: 'Feature Priority Quadratic Vote', time: '2 hours ago', type: 'Quadratic' },
    { id: 12, user: '0x5c6d...9e0f', title: 'Budget Allocation', time: '3 hours ago', type: 'Quadratic' },
    { id: 13, user: '0x9e0f...1c2d', title: 'Marketing Campaign Strategy', time: '3 hours ago', type: 'Multiple Choice' },
    { id: 14, user: '0x1c2d...4e5f', title: 'Token Burn Mechanism', time: '4 hours ago', type: 'Single Choice' },
    { id: 15, user: '0x7a8b...6c7d', title: 'Security Audit Proposal', time: '4 hours ago', type: 'Single Choice' },
    { id: 16, user: '0x4e5f...8a9b', title: 'Community Rewards Program', time: '5 hours ago', type: 'Weighted' },
    { id: 17, user: '0x6c7d...2e3f', title: 'Platform Integration Vote', time: '6 hours ago', type: 'Single Choice' },
    { id: 18, user: '0x3f4e...9a0b', title: 'Governance Token Distribution', time: '7 hours ago', type: 'Weighted' },
    { id: 19, user: '0x9a0b...5c6d', title: 'Ecosystem Fund Allocation', time: '8 hours ago', type: 'Multiple Choice' },
    { id: 20, user: '0x5c6d...1e2f', title: 'Developer Incentive Program', time: '9 hours ago', type: 'Single Choice' },
    { id: 21, user: '0x1e2f...7a8b', title: 'Cross-chain Bridge Proposal', time: '10 hours ago', type: 'Single Choice' },
    { id: 22, user: '0x8b9a...3d4e', title: 'Liquidity Mining Program', time: '11 hours ago', type: 'Weighted' },
    { id: 23, user: '0x3d4e...9f0a', title: 'DAO Structure Reform', time: '12 hours ago', type: 'Single Choice' },
    { id: 24, user: '0x9f0a...5c6d', title: 'Risk Management Framework', time: '13 hours ago', type: 'Multiple Choice' },
    { id: 25, user: '0x2f3e...8a9b', title: 'Insurance Fund Creation', time: '14 hours ago', type: 'Single Choice' },
    { id: 26, user: '0x8a9b...1c2d', title: 'Validator Selection Process', time: '15 hours ago', type: 'Quadratic' },
    { id: 27, user: '0x1c2d...6e7f', title: 'Treasury Diversification', time: '16 hours ago', type: 'Weighted' },
    { id: 28, user: '0x6e7f...3a4b', title: 'Protocol Fee Adjustment', time: '17 hours ago', type: 'Single Choice' },
    { id: 29, user: '0x3a4b...9d0e', title: 'Community Grant Program', time: '18 hours ago', type: 'Multiple Choice' },
    { id: 30, user: '0x9d0e...5f6a', title: 'Ambassador Program Launch', time: '19 hours ago', type: 'Single Choice' },
    { id: 31, user: '0x5f6a...2b3c', title: 'Hackathon Sponsorship', time: '20 hours ago', type: 'Single Choice' },
    { id: 32, user: '0x2b3c...8e9f', title: 'Research Initiative Funding', time: '21 hours ago', type: 'Weighted' },
    { id: 33, user: '0x8e9f...1a2b', title: 'Bug Bounty Program Update', time: '22 hours ago', type: 'Single Choice' },
    { id: 34, user: '0x1a2b...7d8e', title: 'Network Upgrade Timeline', time: '23 hours ago', type: 'Single Choice' },
    { id: 35, user: '0x7d8e...4f5a', title: 'Partnership Guidelines', time: '1 day ago', type: 'Multiple Choice' },
    { id: 36, user: '0x4f5a...9b0c', title: 'Compliance Framework', time: '1 day ago', type: 'Single Choice' },
    { id: 37, user: '0x9b0c...6a7b', title: 'User Privacy Policy', time: '1 day ago', type: 'Single Choice' },
    { id: 38, user: '0x6a7b...3c4d', title: 'Platform Terms Update', time: '1 day ago', type: 'Single Choice' },
    { id: 39, user: '0x3c4d...8f9a', title: 'Community Guidelines', time: '2 days ago', type: 'Single Choice' },
    { id: 40, user: '0x8f9a...2b3c', title: 'Dispute Resolution Process', time: '2 days ago', type: 'Multiple Choice' },
    { id: 41, user: '0x2b3c...7e8f', title: 'Voting Power Distribution', time: '2 days ago', type: 'Quadratic' },
    { id: 42, user: '0x7e8f...5a6b', title: 'Delegation Mechanism', time: '2 days ago', type: 'Single Choice' },
    { id: 43, user: '0x5a6b...1c2d', title: 'Snapshot Strategy Update', time: '3 days ago', type: 'Single Choice' },
    { id: 44, user: '0x1c2d...9a0b', title: 'Emergency Pause Protocol', time: '3 days ago', type: 'Single Choice' },
    { id: 45, user: '0x9a0b...4e5f', title: 'Recovery Mechanism Design', time: '3 days ago', type: 'Weighted' },
  ];

  return (
    <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {/* Hero Section */}
        <Card
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 16,
            border: 'none',
            overflow: 'hidden',
          }}
          styles={{
            body: { padding: 32 },
          }}
        >
          <Row gutter={24} align="middle">
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={16}>
                <Title level={2} style={{ color: '#FFFFFF', margin: 0 }}>
                  Welcome to HushVote
                </Title>
                <Paragraph style={{ color: '#F3F4F6', fontSize: 16, margin: 0 }}>
                  Cast your vote with complete privacy using Fully Homomorphic Encryption.
                  Your choices remain encrypted throughout the entire voting process.
                </Paragraph>
                <Space size={12}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircleOutlined />}
                    onClick={() => navigate('/votings')}
                    style={{
                      background: '#FFFFFF',
                      color: '#764ba2',
                      border: 'none',
                      height: 44,
                    }}
                  >
                    View Active Votings
                  </Button>
                  <Button
                    size="large"
                    ghost
                    style={{
                      color: '#FFFFFF',
                      borderColor: '#FFFFFF',
                      height: 44,
                    }}
                    onClick={() => navigate('/how-it-works')}
                  >
                    How It Works
                  </Button>
                </Space>
              </Space>
            </Col>
            <Col xs={24} lg={8}>
              <div style={{ textAlign: 'center' }}>
                <LockOutlined style={{ fontSize: 120, color: '#FFFFFF', opacity: 0.8 }} />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Stats Section */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Votings"
              value={totalVotings}
              prefix={<CheckCircleOutlined />}
              trend={{ value: 12, isUp: true }}
              description="all votings"
              color="#2563EB"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Votes Cast"
              value={totalVotes}
              prefix={<BarChartOutlined />}
              trend={{ value: 8, isUp: true }}
              description="this month"
              color="#10B981"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Registered Users"
              value={registeredUsers}
              prefix={<TeamOutlined />}
              trend={{ value: Math.floor(Math.random() * 5) + 3, isUp: true }}
              description="new today"
              color="#F59E0B"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Encryption Success"
              value={encryptionSuccess}
              suffix="%"
              prefix={<SafetyOutlined />}
              description="system reliability"
              color="#10B981"
            />
          </Col>
        </Row>

        {/* Security Features */}
        <Card
          title="Security Features"
          style={{ borderRadius: 12 }}
          extra={
            <Button type="link" onClick={() => navigate('/security')}>
              Learn More
            </Button>
          }
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Space direction="vertical" size={8}>
                <SafetyOutlined style={{ fontSize: 32, color: '#2563EB' }} />
                <Text strong>End-to-End Encryption</Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Votes are encrypted on your device before transmission
                </Text>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space direction="vertical" size={8}>
                <LockOutlined style={{ fontSize: 32, color: '#10B981' }} />
                <Text strong>Homomorphic Tallying</Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Results computed without decrypting individual votes
                </Text>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space direction="vertical" size={8}>
                <SafetyOutlined style={{ fontSize: 32, color: '#F59E0B' }} />
                <Text strong>Verifiable Voting</Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Verify your vote without revealing your choice
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Creation Records */}
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Title level={3} style={{ margin: 0 }}>
              Recent Voting Creations
            </Title>
            <Button
              type="link"
              onClick={() => navigate('/votings')}
              style={{ padding: 0 }}
            >
              View All Votings
            </Button>
          </div>

          <Card 
            style={{ 
              borderRadius: 12, 
              maxHeight: 400, 
              overflow: 'hidden'
            }}
            styles={{
              body: { padding: 0 }
            }}
          >
            <div style={{ 
              maxHeight: 400, 
              overflowY: 'auto',
              animation: 'scroll 60s linear infinite',
            }}>
              <style>{`
                @keyframes scroll {
                  0% { transform: translateY(0); }
                  100% { transform: translateY(-50%); }
                }
                .record-list:hover {
                  animation-play-state: paused;
                }
              `}</style>
              <div className="record-list">
                {[...creationRecords, ...creationRecords].map((record, index) => (
                  <div
                    key={`${record.id}-${index}`}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => navigate('/votings')}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 14 }}>{record.title}</Text>
                        <Text type="secondary" style={{ 
                          fontSize: 11, 
                          background: '#f0f0f0', 
                          padding: '2px 6px', 
                          borderRadius: 4 
                        }}>
                          {record.type}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>by {record.user}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.time}</Text>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </Space>
    </Content>
  );
};