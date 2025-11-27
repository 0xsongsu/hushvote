import React from 'react';
import { Empty, Button, Space, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  size?: 'small' | 'default' | 'large';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  actionText,
  onAction,
  size = 'default',
}) => {
  const iconSize = size === 'large' ? 64 : size === 'default' ? 48 : 32;
  const padding = size === 'large' ? 64 : size === 'default' ? 48 : 32;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding,
        textAlign: 'center',
      }}
    >
      <Space direction="vertical" size={16} align="center">
        {icon ? (
          <div style={{ fontSize: iconSize, color: '#9CA3AF' }}>
            {icon}
          </div>
        ) : (
          <InboxOutlined style={{ fontSize: iconSize, color: '#9CA3AF' }} />
        )}

        {title && (
          <Title level={size === 'large' ? 4 : 5} style={{ margin: 0 }}>
            {title}
          </Title>
        )}

        {description && (
          <Text type="secondary" style={{ maxWidth: 400 }}>
            {description}
          </Text>
        )}

        {action ? (
          action
        ) : actionText && onAction ? (
          <Button type="primary" onClick={onAction}>
            {actionText}
          </Button>
        ) : null}
      </Space>
    </div>
  );
};

// Preset empty states
export const NoVotingsEmpty: React.FC<{ onCreateVoting?: () => void }> = ({ onCreateVoting }) => (
  <EmptyState
    title="No Votings Found"
    description="There are no votings available at the moment. Create your first voting to get started."
    actionText="Create Voting"
    onAction={onCreateVoting}
  />
);

export const NotConnectedEmpty: React.FC<{ onConnect?: () => void }> = ({ onConnect }) => (
  <EmptyState
    title="Wallet Not Connected"
    description="Please connect your wallet to view and participate in votings."
    actionText="Connect Wallet"
    onAction={onConnect}
  />
);

export const NoResultsEmpty: React.FC = () => (
  <EmptyState
    title="No Results Yet"
    description="Results will be available after the voting ends and decryption is complete."
  />
);

export const NoMatchingEmpty: React.FC<{ onClearFilters?: () => void }> = ({ onClearFilters }) => (
  <EmptyState
    title="No Matching Results"
    description="No votings match your current filters. Try adjusting your search criteria."
    actionText="Clear Filters"
    onAction={onClearFilters}
  />
);

export default EmptyState;
