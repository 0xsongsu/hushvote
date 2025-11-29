import React, { useState } from 'react';
import {
  Layout,
  Card,
  Table,
  Space,
  Typography,
  Button,
  Tag,
  Row,
  Col,
  Dropdown,
  Modal,
  message,
  Progress,
  Statistic,
  Alert,
} from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  UnlockOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  BarChartOutlined,
  PlusOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAllVotingsWithUserStatus, requestDecryptionFrom } from '../services/contractService';
import { Voting, VotingStatus, VotingType } from '../types';
import { StatCard } from '../components/StatCard';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedVoting, setSelectedVoting] = useState<Voting | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDecryptModal, setShowDecryptModal] = useState(false);

  const { data: votings, isLoading, refetch } = useQuery({
    queryKey: ['admin-votings-onchain'],
    queryFn: async () => {
      // Use optimized batch reading - much faster than individual calls
      const { votings: list } = await getAllVotingsWithUserStatus();
      const typeMap: Record<number, VotingType> = { 0: VotingType.SINGLE_CHOICE, 1: VotingType.MULTIPLE_CHOICE, 2: VotingType.WEIGHTED, 3: VotingType.QUADRATIC };

      // Build UI Voting model - status is already included from batch read
      return list.map((v) => {
        const source = (v as any).source || 'ballot';
        // Use status from batch response (already computed)
        const statusNum = (v as any).status ?? 0;
        const status: VotingStatus = statusNum === 1 ? VotingStatus.ACTIVE : statusNum === 2 ? VotingStatus.ENDED : statusNum === 3 ? VotingStatus.TALLIED : VotingStatus.PENDING;

        return {
          id: String(v.id),
          title: v.title,
          description: v.description,
          type: typeMap[v.votingType] ?? VotingType.SINGLE_CHOICE,
          status,
          options: (v.options || []).map((name, idx) => ({ id: String(idx), label: String(name) })),
          startTime: String(v.startTime * 1000),
          endTime: String(v.endTime * 1000),
          createdBy: v.creator || '',
          totalVoters: v.totalVotes,
          allowReencryption: false,
          createdAt: '',
          updatedAt: '',
          source,
        };
      });
    },
  });

  const stats = {
    totalVotings: votings?.length || 0,
    activeVotings: votings?.filter(v => v.status === VotingStatus.ACTIVE).length || 0,
    totalVotes: (votings || []).reduce((sum, v) => sum + (v.totalVoters || 0), 0),
    resultsAvailable: votings?.filter(v => v.status === VotingStatus.TALLIED).length || 0,
  };

  // Start/End are auto-driven by time on-chain; no manual status mutation anymore.

  // On-chain delete is not supported; remove delete flow.

  const initiateDecryptionMutation = useMutation({
    mutationFn: ({ id, source }: { id: string; source: 'ballot' | 'quadratic' }) => requestDecryptionFrom(source, Number(id)),
    onSuccess: () => { message.success('Decryption process initiated'); setShowDecryptModal(false); setSelectedVoting(null); refetch(); },
    onError: () => { message.error('Failed to initiate decryption'); },
  });

  const getStatusColor = (status: VotingStatus) => {
    const colors = {
      [VotingStatus.PENDING]: 'default',
      [VotingStatus.ACTIVE]: 'success',
      [VotingStatus.ENDED]: 'warning',
      [VotingStatus.TALLIED]: 'processing',
    };
    return colors[status];
  };

  const getTypeLabel = (type: VotingType) => {
    const labels = {
      [VotingType.SINGLE_CHOICE]: 'Single',
      [VotingType.MULTIPLE_CHOICE]: 'Multiple',
      [VotingType.WEIGHTED]: 'Weighted',
      [VotingType.QUADRATIC]: 'Quadratic',
    };
    return labels[type];
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Voting) => (
        <Space direction="vertical" size={0}>
          <Text strong>{title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.options.length} options
          </Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: VotingType) => (
        <Tag color="blue">{getTypeLabel(type)}</Tag>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (_: any, record: any) => (
        <Tag color={record.source === 'quadratic' ? 'purple' : 'geekblue'}>
          {record.source === 'quadratic' ? 'Quadratic' : 'Ballot'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: VotingStatus) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      width: 200,
      render: (_: any, record: Voting) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>
            Start: {dayjs(record.startTime).format('MMM DD, HH:mm')}
          </Text>
          <Text style={{ fontSize: 12 }}>
            End: {dayjs(record.endTime).format('MMM DD, HH:mm')}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Participation',
      key: 'participation',
      width: 150,
      render: (_: any, record: Voting) => {
        const participated = Math.floor(Math.random() * record.totalVoters);
        const percentage = Math.round((participated / record.totalVoters) * 100);
        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Progress
              percent={percentage}
              size="small"
              strokeColor="#2563EB"
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {participated}/{record.totalVoters} voters
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: Voting) => {
        const menuItems = [
          {
            key: 'view',
            icon: <BarChartOutlined />,
            label: 'View Results',
            onClick: () => navigate(`/results/${(record as any).source || 'ballot'}/${record.id}`),
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => navigate(`/admin/edit/${record.id}`),
            disabled: record.status !== VotingStatus.PENDING,
          },
        ];

        // Start/End removed: contract auto-handles based on time window

        if (record.status === VotingStatus.ENDED) {
          menuItems.push({
            key: 'decrypt',
            icon: <UnlockOutlined />,
            label: 'Request Decryption',
            onClick: () => initiateDecryptionMutation.mutate({ id: record.id, source: (record as any).source || 'ballot' }),
            disabled: false,
          });
        }

        // No deletion on-chain; omit delete action.

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <Content style={{ padding: 24 }}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Title level={2} style={{ margin: 0 }}>
            Admin Dashboard
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate('/admin/create')}
          >
            Create New Voting
          </Button>
        </div>

        {/* Stats */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Votings"
              value={stats.totalVotings}
              prefix={<BarChartOutlined />}
              color="#2563EB"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Votings"
              value={stats.activeVotings}
              prefix={<CheckCircleOutlined />}
              trend={{ value: 12, isUp: true }}
              color="#10B981"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Votes"
              value={stats.totalVotes}
              prefix={<ClockCircleOutlined />}
              trend={{ value: 8, isUp: true }}
              color="#F59E0B"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Results Available"
              value={stats.resultsAvailable}
              prefix={<CheckCircleOutlined />}
              trend={{ value: 0, isUp: true }}
              color="#8B5CF6"
            />
          </Col>
        </Row>

        {/* Privacy Alert */}
        <Alert
          message="FHE Protection Active"
          description="All votes are encrypted using Fully Homomorphic Encryption. Individual votes remain private throughout the voting process."
          type="success"
          showIcon
          icon={<LockOutlined />}
        />

        {/* Votings Table */}
        <Card
          title="Manage Votings"
          style={{ borderRadius: 12 }}
        >
          <Table
            dataSource={votings}
            columns={columns}
            loading={isLoading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} votings`,
            }}
          />
        </Card>
      </Space>

      {/* Delete removed; not supported on-chain */}

      {/* Decryption Modal */}
      <Modal
        title="Initiate Decryption"
        open={showDecryptModal}
        onOk={() => selectedVoting && initiateDecryptionMutation.mutate({ id: selectedVoting.id, source: (selectedVoting as any).source || 'ballot' })}
        onCancel={() => setShowDecryptModal(false)}
        confirmLoading={initiateDecryptionMutation.isPending}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            message="Threshold Decryption Required"
            description={`This voting requires ${selectedVoting?.decryptionThreshold || 3} authorized participants to submit their key shares for decryption.`}
            type="info"
            showIcon
          />
          <Text>
            Once initiated, authorized participants will be notified to submit their decryption key shares.
            Results will be revealed once the threshold is met.
          </Text>
        </Space>
      </Modal>
    </Content>
  );
};
