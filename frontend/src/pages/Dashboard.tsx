import React, { useMemo } from 'react';
import { Layout, Row, Col, Card, Space, Typography, Button, Spin } from 'antd';
import {
  BarChartOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  LockOutlined,
  SafetyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import { VotingCard } from '../components/VotingCard';
import { useVotingContext, useVotingStats } from '../context/VotingContext';
import { useWallet } from '../hooks/useWallet';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

// Helper to get voting type label
const getVotingTypeLabel = (typeNum: number): string => {
  const labels: Record<number, string> = {
    0: 'Single Choice',
    1: 'Multiple Choice',
    2: 'Weighted',
    3: 'Quadratic',
  };
  return labels[typeNum] || 'Single Choice';
};

// Helper to format time ago
const getTimeAgo = (startTime: number): string => {
  return dayjs(startTime * 1000).fromNow();
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();

  // Use global VotingContext for data
  const {
    votings,
    isLoading,
    isRefetching,
    refresh,
    activeVotings: contextActiveVotings,
    hasUserVoted,
  } = useVotingContext();

  // Use the stats hook for computed statistics
  const stats = useVotingStats();

  // Get recent votings for display (sorted by start time, most recent first)
  const recentVotings = useMemo(() => {
    return [...votings]
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 20); // Show last 20
  }, [votings]);

  // Get active votings for quick access (top 3)
  const activeVotings = useMemo(() => {
    return contextActiveVotings.slice(0, 3);
  }, [contextActiveVotings]);

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
                    onClick={() => navigate('/votings?tab=active')}
                    style={{
                      background: '#FFFFFF',
                      color: '#764ba2',
                      border: 'none',
                      height: 44,
                    }}
                  >
                    View Active Votings ({stats.active})
                  </Button>
                  <Button
                    size="large"
                    ghost
                    icon={<ReloadOutlined spin={isRefetching} />}
                    onClick={() => refresh()}
                    style={{
                      color: '#FFFFFF',
                      borderColor: '#FFFFFF',
                      height: 44,
                    }}
                    loading={isRefetching}
                  >
                    Refresh
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

        {/* Stats Section - Real On-Chain Data */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Votings"
              value={isLoading ? '-' : stats.total}
              prefix={<CheckCircleOutlined />}
              description="on-chain votings"
              color="#2563EB"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Votings"
              value={isLoading ? '-' : stats.active}
              prefix={<BarChartOutlined />}
              trend={stats.active > 0 ? { value: stats.active, isUp: true } : undefined}
              description="currently open"
              color="#10B981"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Votes Cast"
              value={isLoading ? '-' : stats.totalVotes}
              prefix={<TeamOutlined />}
              description="encrypted votes"
              color="#F59E0B"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Completed"
              value={isLoading ? '-' : stats.ended + stats.tallied}
              prefix={<SafetyOutlined />}
              description="ended votings"
              color="#8B5CF6"
            />
          </Col>
        </Row>

        {/* Active Votings Quick Access */}
        {activeVotings.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <Title level={3} style={{ margin: 0 }}>
                Active Votings
              </Title>
              <Button
                type="link"
                onClick={() => navigate('/votings?tab=active')}
                style={{ padding: 0 }}
              >
                View All Active
              </Button>
            </div>
            <Row gutter={[16, 16]}>
              {activeVotings.map((voting) => {
                const source = (voting as any).source || 'ballot';
                return (
                  <Col xs={24} md={12} lg={8} key={`${source}-${voting.id}`}>
                    <VotingCard
                      id={voting.id}
                      title={voting.title}
                      description={voting.description}
                      startTime={new Date(voting.startTime * 1000)}
                      endTime={new Date(voting.endTime * 1000)}
                      totalVotes={voting.totalVotes}
                      status="active"
                      source={source}
                      hasVoted={hasUserVoted(source, voting.id)}
                      onVote={() => navigate(`/vote/${source}/${voting.id}`)}
                      onViewResults={() => navigate(`/results/${source}/${voting.id}`)}
                    />
                  </Col>
                );
              })}
            </Row>
          </div>
        )}

        {/* Security Features */}
        <Card
          title="Security Features"
          style={{ borderRadius: 12 }}
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

        {/* Recent Votings - Real On-Chain Data */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Title level={3} style={{ margin: 0 }}>
              Recent Votings
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
            {isLoading ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <Spin size="large" />
              </div>
            ) : recentVotings.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <Text type="secondary">
                  {isConnected ? 'No votings found on-chain' : 'Connect wallet to view votings'}
                </Text>
              </div>
            ) : (
              <div style={{
                maxHeight: 400,
                overflowY: 'auto',
              }}>
                {recentVotings.map((voting, index) => {
                  const status = (voting as any).status;
                  const statusLabel = status === 1 ? 'Active' : status === 2 ? 'Ended' : status === 3 ? 'Tallied' : 'Pending';
                  const statusColor = status === 1 ? '#10B981' : status === 2 ? '#F59E0B' : status === 3 ? '#2563EB' : '#9CA3AF';
                  const source = (voting as any).source || 'ballot';

                  return (
                    <div
                      key={`${source}-${voting.id}`}
                      style={{
                        padding: '12px 16px',
                        borderBottom: index < recentVotings.length - 1 ? '1px solid #f0f0f0' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => navigate(`/vote/${source}/${voting.id}`)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text strong style={{ fontSize: 14 }}>{voting.title}</Text>
                          <Text style={{
                            fontSize: 11,
                            background: '#f0f0f0',
                            padding: '2px 6px',
                            borderRadius: 4
                          }}>
                            {getVotingTypeLabel(voting.votingType)}
                          </Text>
                          <Text style={{
                            fontSize: 11,
                            background: statusColor,
                            color: '#FFFFFF',
                            padding: '2px 6px',
                            borderRadius: 4
                          }}>
                            {statusLabel}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {voting.totalVotes} votes
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Started {getTimeAgo(voting.startTime)}
                          </Text>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </Space>
    </Content>
  );
};
