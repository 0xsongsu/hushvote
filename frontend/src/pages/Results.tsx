import React, { useState } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Progress,
  Button,
  Alert,
  Table,
  Tag,
  Statistic,
  Spin,
  Modal,
  Input,
  message,
} from 'antd';
import {
  BarChartOutlined,
  LockOutlined,
  UnlockOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { mockApi, resultsApi } from '../services/api';
import { getStatusFrom, getVotingFrom, getResultsFrom } from '../services/contractService';
import { VotingStatus, VotingType, VotingOption } from '../types';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export const Results: React.FC = () => {
  const { id, source } = useParams<{ id: string, source?: 'ballot' | 'quadratic' }>();
  const navigate = useNavigate();
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [onchainTallied, setOnchainTallied] = useState<boolean>(false);

  const { data: voting, isLoading: votingLoading } = useQuery({
    queryKey: ['voting-onchain', source, id],
    queryFn: async () => {
      const vid = Number(id);
      const v = await getVotingFrom((source as any) || 'ballot', vid);
      const typeMap: Record<number, VotingType> = { 0: VotingType.SINGLE_CHOICE, 1: VotingType.MULTIPLE_CHOICE, 2: VotingType.WEIGHTED, 3: VotingType.QUADRATIC };
      // Determine current status from chain
      const statusNum = await getStatusFrom((source as any) || 'ballot', vid);
      const status: VotingStatus = statusNum === 1 ? VotingStatus.ACTIVE : statusNum === 2 ? VotingStatus.ENDED : statusNum === 3 ? VotingStatus.TALLIED : VotingStatus.PENDING;
      const options: VotingOption[] = (v.options || []).map((name, idx) => ({ id: String(idx), label: String(name) }));
      return {
        id: String(v.id),
        title: v.title,
        description: v.description,
        type: typeMap[v.votingType] ?? VotingType.SINGLE_CHOICE,
        status,
        options,
        startTime: String(v.startTime * 1000),
        endTime: String(v.endTime * 1000),
        createdBy: v.creator || '',
        totalVoters: v.totalVotes,
        allowReencryption: false,
        createdAt: '',
        updatedAt: '',
        // @ts-ignore pass source
        source: (v as any).source || 'ballot',
      };
    },
    enabled: !!id,
  });

  // Check on-chain status to decide if results are available
  React.useEffect(() => {
    const check = async () => {
      if (!id) return;
      try {
        const vid = Number(id);
        if (!Number.isFinite(vid)) return;
        const s = await getStatusFrom((source as any) || 'ballot', vid);
        setOnchainTallied(s === 3);
      } catch {
        setOnchainTallied(false);
      }
    };
    check();
  }, [id]);

  // On-chain results data (when Tallied)
  const { data: onchainResults } = useQuery({
    queryKey: ['results-onchain', source, id],
    queryFn: () => getResultsFrom((source as any) || 'ballot', Number(id)),
    enabled: !!id && !!voting && (onchainTallied || voting.status === VotingStatus.TALLIED),
  });

  const submitDecryptionMutation = useMutation({
    mutationFn: async () => {
      if (!voting) throw new Error('No voting data');
      
      await resultsApi.submitDecryptionKey({
        votingId: voting.id,
        keyShare: decryptionKey,
        participant: '0x1234...', // Mock address
      });
    },
    onSuccess: () => {
      message.success('Decryption key submitted successfully');
      setShowDecryptModal(false);
      setDecryptionKey('');
    },
    onError: () => {
      message.error('Failed to submit decryption key');
    },
  });

  if (votingLoading || !voting) {
    return (
      <Content style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </Content>
    );
  }

  const isDecrypted = onchainTallied || voting.status === VotingStatus.TALLIED;
  const counts = isDecrypted && onchainResults ? onchainResults : voting.options.map(() => 0);
  const totalVotes = counts.reduce((a, b) => a + b, 0);
  const percentages = counts.map((c) => (totalVotes > 0 ? Math.round((c / totalVotes) * 100) : 0));
  const winnerIndex = counts.reduce((best, c, i, arr) => (c > arr[best] ? i : best), 0);
  const chartData = voting.options.map((opt, idx) => ({ name: opt.label, value: counts[idx], percentage: percentages[idx], optionId: opt.id }));

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => {
        if (rank === 1) return <TrophyOutlined style={{ color: '#F59E0B', fontSize: 20 }} />;
        return rank;
      },
    },
    {
      title: 'Option',
      dataIndex: 'label',
      key: 'label',
      render: (label: string, record: any) => (
        <Space>
          <Text strong>{label}</Text>
          {record.rank === 1 && (
            <Tag color="gold">Winner</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Votes',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => (
        <Text strong>{isDecrypted ? count : '***'}</Text>
      ),
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage: number) => (
        <Progress
          percent={isDecrypted ? percentage : 0}
          size="small"
          strokeColor="#2563EB"
          format={(percent) => isDecrypted ? `${percent}%` : '***'}
        />
      ),
    },
  ];

  const tableData = chartData
    .sort((a, b) => b.value - a.value)
    .map((r, index) => ({ key: r.optionId, rank: index + 1, label: r.name, count: r.value, percentage: r.percentage }));

  return (
    <Content style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {/* Header */}
        <Card style={{ borderRadius: 12 }}>
          <Row gutter={24} align="middle">
            <Col flex="1">
              <Space direction="vertical" size={8}>
                <Title level={3} style={{ margin: 0 }}>
                  {voting.title}
                </Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  {voting.description}
                </Paragraph>
              </Space>
            </Col>
            <Col>
              <Space>
                {!isDecrypted && (
                  <Button
                    icon={<UnlockOutlined />}
                    onClick={() => setShowDecryptModal(true)}
                  >
                    Submit Decryption Key
                  </Button>
                )}
                <Button icon={<ShareAltOutlined />}>
                  Share Results
                </Button>
                <Button type="primary" icon={<DownloadOutlined />}>
                  Export Report
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Status Alert */}
        {isDecrypted ? (
          <Alert
            message="Results Decrypted"
            description={`These results were collectively decrypted on ${new Date(mockResults.decryptedAt!).toLocaleString()}`}
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        ) : (
          <Alert
            message="Encrypted Results"
            description="Results are currently encrypted. Collective decryption is required to reveal the final tallies."
            type="warning"
            showIcon
            icon={<LockOutlined />}
          />
        )}

        {/* Summary Stats */}
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="Total Votes"
                value={isDecrypted ? totalVotes : '***'}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="Participation Rate"
                value={isDecrypted ? Math.round((totalVotes / (voting.totalVoters || 1)) * 100) : '***'}
                suffix={isDecrypted ? '%' : ''}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title="Leading Option"
                value={isDecrypted ? voting.options[winnerIndex]?.label : '***'}
                valueStyle={{ fontSize: 20 }}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Results Visualization */}
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title="Results Table" style={{ borderRadius: 12 }}>
              <Table
                dataSource={tableData}
                columns={columns}
                pagination={false}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Vote Distribution" style={{ borderRadius: 12 }}>
              {isDecrypted ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ 
                  height: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: '#F7F9FC',
                  borderRadius: 8,
                }}>
                  <Space direction="vertical" align="center">
                    <LockOutlined style={{ fontSize: 48, color: '#9CA3AF' }} />
                    <Text type="secondary">Chart available after decryption</Text>
                  </Space>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Privacy Notice */}
        <Alert
          message="Privacy Protection"
          description="Individual votes remain encrypted and private. Only aggregated results are revealed after collective decryption."
          type="info"
          showIcon
          icon={<LockOutlined />}
        />
      </Space>

      {/* Decryption Modal */}
      <Modal
        title="Submit Decryption Key Share"
        open={showDecryptModal}
        onOk={() => submitDecryptionMutation.mutate()}
        onCancel={() => setShowDecryptModal(false)}
        confirmLoading={submitDecryptionMutation.isPending}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            message="Threshold Decryption"
            description={`This voting requires ${voting.decryptionThreshold || 3} key shares for decryption. Your key share will be combined with others to reveal the results.`}
            type="info"
            showIcon
          />
          <Input.TextArea
            placeholder="Enter your decryption key share..."
            rows={4}
            value={decryptionKey}
            onChange={(e) => setDecryptionKey(e.target.value)}
          />
        </Space>
      </Modal>
    </Content>
  );
};
