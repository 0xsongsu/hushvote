import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Space, Typography, Input, Select, Tabs, Empty, Spin, Badge, Button, message } from 'antd';
import { SearchOutlined, FilterOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { VotingCard } from '../components/VotingCard';
import { getAllVotings, VotingData, hasUserVotedFrom, getStatusFrom } from '../services/contractService';
import { VotingStatus, VotingType } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';

const { Content } = Layout;
const { Title } = Typography;
const { Search } = Input;

export const VotingList: React.FC = () => {
  const navigate = useNavigate();
  const { wallet, isConnected } = useWallet();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VotingStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<VotingType | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'ballot' | 'quadratic'>('all');
  const [votings, setVotings] = useState<VotingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userVotes, setUserVotes] = useState<{ [key: number]: boolean }>({});
  const [statusById, setStatusById] = useState<{ [key: number]: VotingStatus }>({});

  const fetchVotings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      if (isConnected && wallet) {
        // Try to fetch from contract
        try {
          const contractVotings = await getAllVotings();
          setVotings(contractVotings);

          // Fetch on-chain status for accurate tab categorization
          const statusMap: { [key: number]: VotingStatus } = {};
          for (const v of contractVotings) {
            try {
              const s = await getStatusFrom((v as any).source || 'ballot', v.id);
              statusMap[v.id] = s === 1
                ? VotingStatus.ACTIVE
                : s === 2
                ? VotingStatus.ENDED
                : s === 3
                ? VotingStatus.TALLIED
                : VotingStatus.PENDING; // 0 or unknown
            } catch {
              // fallback to time-based
              const now = Date.now() / 1000;
              statusMap[v.id] = now < v.startTime
                ? VotingStatus.PENDING
                : now <= v.endTime
                ? VotingStatus.ACTIVE
                : VotingStatus.ENDED;
            }
          }
          setStatusById(statusMap);
          
          // Check if user has voted
          if (wallet?.address && contractVotings.length > 0) {
            const voteStatuses: { [key: number]: boolean } = {};
            for (const voting of contractVotings) {
              try {
                voteStatuses[voting.id] = await hasUserVotedFrom((voting as any).source || 'ballot', voting.id, wallet.address);
              } catch {
                voteStatuses[voting.id] = false;
              }
            }
            setUserVotes(voteStatuses);
          }
        } catch (error: any) {
          // If contract is not initialized or no votings, show empty state
          console.log('No votings found or contract not initialized');
          setVotings([]);
        }
      } else {
        setVotings([]);
      }
    } catch (error) {
      console.error('Failed to fetch votings:', error);
      // Don't show error message for expected cases
      setVotings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVotings();
  }, [isConnected]);

  // Initialize status filter from query string (?tab=active|pending|ended|tallied)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = (params.get('tab') || '').toLowerCase();
    const map: Record<string, VotingStatus> = {
      active: VotingStatus.ACTIVE,
      pending: VotingStatus.PENDING,
      ended: VotingStatus.ENDED,
      tallied: VotingStatus.TALLIED,
    };
    if (tab && map[tab]) {
      setStatusFilter(map[tab]);
    }
  }, [location.search]);

  const getVotingStatus = (voting: VotingData): VotingStatus => {
    return statusById[voting.id] || (() => {
      const now = Date.now() / 1000;
      if (now < voting.startTime) return VotingStatus.PENDING;
      if (now <= voting.endTime) return VotingStatus.ACTIVE;
      return VotingStatus.ENDED;
    })();
  };

  const typeMap: Record<string, number> = {
    [VotingType.SINGLE_CHOICE]: 0,
    [VotingType.MULTIPLE_CHOICE]: 1,
    [VotingType.WEIGHTED]: 2,
    [VotingType.QUADRATIC]: 3,
  };

  const filteredVotings = votings.filter((voting) => {
    const matchesSearch = voting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          voting.description.toLowerCase().includes(searchTerm.toLowerCase());
    const votingStatus = getVotingStatus(voting);
    const matchesStatus = statusFilter === 'all' || votingStatus === statusFilter;
    const selectedTypeNum = typeFilter === 'all' ? null : typeMap[typeFilter as string];
    const matchesType = typeFilter === 'all' || voting.votingType === selectedTypeNum;
    const src = (voting as any).source || 'ballot';
    const matchesSource = sourceFilter === 'all' || src === sourceFilter;
    return matchesSearch && matchesStatus && matchesType && matchesSource;
  });

  const statusCounts = {
    all: votings.length,
    [VotingStatus.ACTIVE]: votings.filter(v => getVotingStatus(v) === VotingStatus.ACTIVE).length,
    [VotingStatus.PENDING]: votings.filter(v => getVotingStatus(v) === VotingStatus.PENDING).length,
    [VotingStatus.ENDED]: votings.filter(v => getVotingStatus(v) === VotingStatus.ENDED).length,
    [VotingStatus.TALLIED]: votings.filter(v => getVotingStatus(v) === VotingStatus.TALLIED).length,
  };

  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          All Votings
          <Badge count={statusCounts.all} style={{ marginLeft: 8 }} />
        </span>
      ),
    },
    {
      key: VotingStatus.ACTIVE,
      label: (
        <span>
          Active
          <Badge count={statusCounts[VotingStatus.ACTIVE]} style={{ marginLeft: 8 }} color="green" />
        </span>
      ),
    },
    {
      key: VotingStatus.PENDING,
      label: (
        <span>
          Pending
          <Badge count={statusCounts[VotingStatus.PENDING]} style={{ marginLeft: 8 }} />
        </span>
      ),
    },
    {
      key: VotingStatus.ENDED,
      label: (
        <span>
          Ended
          <Badge count={statusCounts[VotingStatus.ENDED]} style={{ marginLeft: 8 }} color="orange" />
        </span>
      ),
    },
    {
      key: VotingStatus.TALLIED,
      label: (
        <span>
          Results Available
          <Badge count={statusCounts[VotingStatus.TALLIED]} style={{ marginLeft: 8 }} color="blue" />
        </span>
      ),
    },
  ];

  return (
    <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {/* Header */}
        <div>
          <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
            Votings
          </Title>
        </div>

        {/* Filters */}
        <Row gutter={16} align="middle">
          <Col xs={24} md={12} lg={8}>
            <Search
              placeholder="Search votings..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
              size="large"
            />
          </Col>
          <Col xs={12} md={6} lg={4}>
            <Select
              placeholder="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
              size="large"
              suffixIcon={<FilterOutlined />}
            >
              <Select.Option value="all">All Types</Select.Option>
              <Select.Option value={VotingType.SINGLE_CHOICE}>Single Choice</Select.Option>
              <Select.Option value={VotingType.MULTIPLE_CHOICE}>Multiple Choice</Select.Option>
              <Select.Option value={VotingType.WEIGHTED}>Weighted</Select.Option>
              <Select.Option value={VotingType.QUADRATIC}>Quadratic</Select.Option>
            </Select>
          </Col>
          <Col xs={12} md={6} lg={4}>
            <Select
              placeholder="Source"
              value={sourceFilter}
              onChange={setSourceFilter}
              style={{ width: '100%' }}
              size="large"
              suffixIcon={<FilterOutlined />}
            >
              <Select.Option value="all">All Sources</Select.Option>
              <Select.Option value="ballot">Ballot</Select.Option>
              <Select.Option value="quadratic">Quadratic</Select.Option>
            </Select>
          </Col>
        </Row>

        {/* Tabs */}
        <Tabs
          activeKey={statusFilter}
          onChange={(key) => {
            setStatusFilter(key as VotingStatus | 'all');
            const tabMap: Record<string, string> = {
              [VotingStatus.ACTIVE]: 'active',
              [VotingStatus.PENDING]: 'pending',
              [VotingStatus.ENDED]: 'ended',
              [VotingStatus.TALLIED]: 'tallied',
              ['all']: 'all',
            } as any;
            const q = new URLSearchParams(location.search);
            q.set('tab', tabMap[key] || 'all');
            navigate(`/votings?${q.toString()}`);
          }}
          items={tabItems}
          size="large"
        />

        {/* Action Buttons */}
        <Row justify="end" style={{ marginTop: -48, marginBottom: 24 }}>
          <Space>
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={() => fetchVotings(false)}
              loading={refreshing}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/create')}
            >
              Create Voting
            </Button>
          </Space>
        </Row>

        {/* Voting Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : filteredVotings.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredVotings.map((voting) => {
              const votingStatus = getVotingStatus(voting);
              return (
                <Col xs={24} lg={12} xl={8} key={voting.id}>
                  <VotingCard
                    id={voting.id}
                    title={voting.title}
                    description={voting.description}
                    startTime={new Date(voting.startTime * 1000)}
                    endTime={new Date(voting.endTime * 1000)}
                    totalVotes={voting.totalVotes}
                    status={
                      votingStatus === VotingStatus.ACTIVE
                        ? 'active'
                        : votingStatus === VotingStatus.PENDING
                        ? 'pending'
                        : 'ended'
                    }
                    source={(voting as any).source || 'ballot'}
                    onVote={() => navigate(`/vote/${(voting as any).source || 'ballot'}/${voting.id}`)}
                    onViewResults={() => navigate(`/results/${(voting as any).source || 'ballot'}/${voting.id}`)}
                    hasVoted={userVotes[voting.id] || false}
                  />
                </Col>
              );
            })}
          </Row>
        ) : (
          <Empty
            description={
              !isConnected
                ? 'Please connect your wallet to view votings'
                : searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No votings found matching your filters'
                : 'No votings available yet'
            }
            style={{ padding: 48 }}
          >
            {!isConnected ? (
              <Button type="primary" onClick={() => window.location.reload()}>
                Connect Wallet
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/admin/create')}
              >
                Create First Voting
              </Button>
            )}
          </Empty>
        )}
      </Space>
    </Content>
  );
};
