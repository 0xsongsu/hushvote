import React from 'react';
import { Alert, Space, Typography, Spin, Progress } from 'antd';
import {
  LockOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  SafetyOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface EncryptionStatusProps {
  status: 'initializing' | 'ready' | 'encrypting' | 'encrypted' | 'error';
  message?: string;
  progress?: number;
}

export const EncryptionStatus: React.FC<EncryptionStatusProps> = ({
  status,
  message,
  progress,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'initializing':
        return {
          type: 'info' as const,
          icon: <LoadingOutlined spin />,
          title: 'Initializing FHE',
          description: message || 'Setting up encryption environment...',
        };
      case 'ready':
        return {
          type: 'success' as const,
          icon: <SafetyOutlined />,
          title: 'Encryption Ready',
          description: message || 'Your vote will be fully encrypted before submission',
        };
      case 'encrypting':
        return {
          type: 'info' as const,
          icon: <LoadingOutlined spin />,
          title: 'Encrypting Vote',
          description: message || 'Applying homomorphic encryption to your vote...',
        };
      case 'encrypted':
        return {
          type: 'success' as const,
          icon: <CheckCircleOutlined />,
          title: 'Vote Encrypted',
          description: message || 'Your vote has been securely encrypted',
        };
      case 'error':
        return {
          type: 'error' as const,
          icon: <SafetyOutlined />,
          title: 'Encryption Error',
          description: message || 'Failed to encrypt vote. Please try again.',
        };
      default:
        return {
          type: 'info' as const,
          icon: <LockOutlined />,
          title: 'Encryption Status',
          description: message || '',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Alert
      type={config.type}
      icon={config.icon}
      message={
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Text strong>{config.title}</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {config.description}
          </Text>
          {progress !== undefined && status === 'encrypting' && (
            <Progress
              percent={progress}
              strokeColor="#2563EB"
              size="small"
              showInfo={false}
            />
          )}
        </Space>
      }
      style={{
        borderRadius: 8,
        border: status === 'ready' || status === 'encrypted' 
          ? '1px solid #10B981' 
          : undefined,
      }}
    />
  );
};