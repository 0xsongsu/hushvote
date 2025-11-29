import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Row, Col, Space, Typography, Input, Select, Tabs, Badge, Button, Spin } from 'antd';
import { SearchOutlined, FilterOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { VotingCard } from '../components/VotingCard';
import { useVotingContext } from '../context/VotingContext';
import { VotingStatus, VotingType } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { NoVotingsEmpty, NotConnectedEmpty, NoMatchingEmpty } from '../components/common/EmptyState';

const { Content } = Layout;
const { Title } = Typography;
const { Search } = Input;

export const VotingList: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VotingStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<VotingType | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'ballot' | 'quadratic'>('all');

  // Use global VotingContext instead of local state
  const {
    votings,
    userVoteStatus,
    isLoading,
    isRefetching,
    refresh,
    getVotingStatus,
    hasUserVoted,
  } = useVotingContext();

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

  const typeMap: Record<string, number> = {
    [VotingType.SINGLE_CHOICE]: 0,
    [VotingType.MULTIPLE_CHOICE]: 1,
    [VotingType.WEIGHTED]: 2,
    [VotingType.QUADRATIC]: 3,
  };

  const filteredVotings = useMemo(() => {
    return votings.filter((voting) => {
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
  }, [votings, searchTerm, statusFilter, typeFilter, sourceFilter, getVotingStatus]);

  const statusCounts = useMemo(() => ({
    all: votings.length,
    [VotingStatus.ACTIVE]: votings.filter(v => getVotingStatus(v) === VotingStatus.ACTIVE).length,
    [VotingStatus.PENDING]: votings.filter(v => getVotingStatus(v) === VotingStatus.PENDING).length,
    [VotingStatus.ENDED]: votings.filter(v => getVotingStatus(v) === VotingStatus.ENDED).length,
    [VotingStatus.TALLIED]: votings.filter(v => getVotingStatus(v) === VotingStatus.TALLIED).length,
  }), [votings, getVotingStatus]);

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

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setSourceFilter('all');
    navigate('/votings');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || sourceFilter !== 'all';

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
              icon={<ReloadOutlined spin={isRefetching} />}
              onClick={() => refresh()}
              loading={isRefetching}
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
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : !isConnected ? (
          <NotConnectedEmpty onConnect={() => window.location.reload()} />
        ) : filteredVotings.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredVotings.map((voting) => {
              const votingStatus = getVotingStatus(voting);
              const source = (voting as any).source || 'ballot';
              return (
                <Col xs={24} lg={12} xl={8} key={`${source}-${voting.id}`}>
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
                    source={source}
                    onVote={() => navigate(`/vote/${source}/${voting.id}`)}
                    onViewResults={() => navigate(`/results/${source}/${voting.id}`)}
                    hasVoted={hasUserVoted(source, voting.id)}
                  />
                </Col>
              );
            })}
          </Row>
        ) : hasActiveFilters ? (
          <NoMatchingEmpty onClearFilters={clearFilters} />
        ) : (
          <NoVotingsEmpty onCreateVoting={() => navigate('/admin/create')} />
        )}
      </Space>
    </Content>
  );
};
