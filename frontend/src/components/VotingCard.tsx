import React from 'react';
import { Card, Tag, Progress, Space, Typography, Button, Tooltip, Row, Col } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  LockOutlined,
  SafetyOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Voting, VotingStatus, VotingType } from '../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Title, Paragraph } = Typography;

interface VotingCardProps {
  id?: number;
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  totalVotes?: number;
  status?: 'active' | 'ended' | 'pending';
  voting?: Voting;
  onVote?: () => void;
  onViewResults?: () => void;
  hasVoted?: boolean;
  source?: 'ballot' | 'quadratic';
}

export const VotingCard: React.FC<VotingCardProps> = ({
  id,
  title,
  description,
  startTime,
  endTime,
  totalVotes,
  status,
  voting,
  onVote,
  onViewResults,
  hasVoted = false,
  source,
}) => {
  const [nowTick, setNowTick] = React.useState<number>(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000); // update every 30s
    return () => clearInterval(t);
  }, []);
  // Use direct props if provided, otherwise fallback to voting object
  const cardTitle = title || voting?.title || 'Untitled Voting';
  const cardDescription = description || voting?.description || '';
  const cardStartTime = startTime || (voting?.startTime ? new Date(voting.startTime) : new Date());
  const cardEndTime = endTime || (voting?.endTime ? new Date(voting.endTime) : new Date());
  const cardTotalVotes = totalVotes ?? voting?.totalVotes ?? 0;
  const cardStatus = status || (voting ? voting.status : 'pending');
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
      [VotingType.SINGLE_CHOICE]: 'Single Choice',
      [VotingType.MULTIPLE_CHOICE]: 'Multiple Choice',
      [VotingType.WEIGHTED]: 'Weighted',
      [VotingType.QUADRATIC]: 'Quadratic',
    };
    return labels[type];
  };

  const getTimeRemaining = () => {
    const now = dayjs(nowTick);
    const start = dayjs(cardStartTime);
    const end = dayjs(cardEndTime);
    
    if (cardStatus === 'ended' || cardStatus === VotingStatus.ENDED || cardStatus === VotingStatus.TALLIED) {
      return 'Voting ended';
    }
    // Not started yet
    if (now.isBefore(start)) {
      return `Starts ${start.fromNow()}`;
    }
    // Active but nearing end
    if (now.isAfter(end)) {
      return 'Voting ended';
    }
    return `Ends ${end.fromNow()}`;
  };

  const getParticipationRate = () => {
    // Mock calculation - in real app, this would come from the API
    const totalVoters = voting?.totalVoters || 100;
    const participated = Math.min(cardTotalVotes, totalVoters);
    return totalVoters > 0 ? Math.round((participated / totalVoters) * 100) : 0;
  };

  const participationRate = getParticipationRate();

  return (
    <Card
      hoverable
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
      styles={{
        body: { padding: 24 },
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* Header */}
        <div>
          <Space size={8} wrap>
            {voting ? (
              <>
                <Tag color={getStatusColor(voting.status)}>
                  {voting.status.toUpperCase()}
                </Tag>
                <Tag color="blue">{getTypeLabel(voting.type)}</Tag>
                {/* Source Tag */}
                {((voting as any).source || source) && (
                  <Tag color={(voting as any).source === 'quadratic' || source === 'quadratic' ? 'purple' : 'geekblue'}>
                    {((voting as any).source || source) === 'quadratic' ? 'Quadratic' : 'Ballot'}
                  </Tag>
                )}
              </>
            ) : (
              <Tag color={cardStatus === 'active' ? 'success' : 'warning'}>
                {cardStatus?.toUpperCase()}
              </Tag>
            )}
            {voting?.allowReencryption && (
              <Tooltip title="Supports vote verification through reencryption">
                <Tag icon={<SafetyOutlined />} color="green">
                  Verifiable
                </Tag>
              </Tooltip>
            )}
            {hasVoted && (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Voted
              </Tag>
            )}
          </Space>
        </div>

        {/* Title and Description */}
        <div>
          <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
            {cardTitle}
          </Title>
          <Paragraph 
            type="secondary" 
            ellipsis={{ rows: 2 }}
            style={{ margin: 0 }}
          >
            {cardDescription}
          </Paragraph>
        </div>

        {/* Encryption Badge */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <LockOutlined style={{ color: '#FFFFFF' }} />
          <Text style={{ color: '#FFFFFF', fontSize: 12 }}>
            Fully Homomorphic Encryption Protected
          </Text>
        </div>

        {/* Stats */}
        <Row gutter={16}>
          <Col span={12}>
            <Space size={4} direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Participation
              </Text>
              <Progress
                percent={participationRate}
                strokeColor="#2563EB"
                trailColor="#E5E7EB"
                size="small"
              />
            </Space>
          </Col>
          <Col span={12}>
            <Space size={4} direction="vertical">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Options
              </Text>
              <Text strong>{Array.isArray(voting?.options) ? voting!.options.length : 0} choices</Text>
            </Space>
          </Col>
        </Row>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 16,
            borderTop: '1px solid #E5E7EB',
          }}
        >
          <Space size={16}>
            <Space size={4}>
              <ClockCircleOutlined />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {getTimeRemaining()}
              </Text>
            </Space>
            <Space size={4}>
              <TeamOutlined />
              <Text type="secondary" style={{ fontSize: 13 }}>
                {cardTotalVotes} votes
              </Text>
            </Space>
          </Space>

          <Space>
            {(cardStatus === 'active' || (voting && voting.status === VotingStatus.ACTIVE)) && !hasVoted && (
              <Button type="primary" onClick={onVote}>
                Cast Vote
              </Button>
            )}
            {(cardStatus === 'ended' || (voting && voting.status === VotingStatus.TALLIED)) && (
              <Button onClick={onViewResults}>
                View Results
              </Button>
            )}
            {hasVoted && (cardStatus === 'active' || (voting && voting.status === VotingStatus.ACTIVE)) && (
              <Button disabled>
                Vote Submitted
              </Button>
            )}
          </Space>
        </div>
      </Space>
    </Card>
  );
};
