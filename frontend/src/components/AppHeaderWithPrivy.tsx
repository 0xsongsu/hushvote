import React from 'react';
import { Layout, Button, Space, Typography, Dropdown, Avatar, Switch, Badge, Tooltip } from 'antd';
import {
  WalletOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  SafetyOutlined,
  PlusOutlined,
  LinkOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  wallet: any;
  wallets: any[];
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onLinkWallet?: () => void;
  isAdmin?: boolean;
}

const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const AppHeaderWithPrivy: React.FC<AppHeaderProps> = ({
  wallet,
  wallets = [],
  isDarkMode,
  onThemeToggle,
  onConnect,
  onDisconnect,
  onLinkWallet,
  isAdmin = false,
}) => {
  const navigate = useNavigate();

  const walletMenuItems = [
    {
      key: 'address',
      label: (
        <Space>
          <WalletOutlined />
          <Text copyable>{wallet?.address}</Text>
        </Space>
      ),
    },
    {
      key: 'wallets',
      label: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">Connected Wallets ({wallets.length})</Text>
          {wallets.map((w, idx) => (
            <Space key={idx}>
              <Badge status={w.address === wallet?.address ? "success" : "default"} />
              <Text>{shortenAddress(w.address)} - {w.type}</Text>
            </Space>
          ))}
        </Space>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'link',
      label: (
        <Space>
          <LinkOutlined />
          Link Another Wallet
        </Space>
      ),
      onClick: onLinkWallet,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          Disconnect All
        </Space>
      ),
      onClick: onDisconnect,
    },
  ];

  return (
    <Header 
      style={{ 
        background: isDarkMode ? '#0B0F14' : '#FFFFFF',
        borderBottom: `1px solid ${isDarkMode ? '#1E2329' : '#E5E7EB'}`,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Space>
        <Space 
          align="center" 
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <img src="/icon_monogram_hv.svg" alt="HushVote" style={{ width: 32, height: 32 }} />
          <Text strong style={{ fontSize: 18, margin: 0 }}>
            HushVote
          </Text>
        </Space>
        <Badge 
          count="Privacy First" 
          style={{ 
            backgroundColor: '#10B981',
            fontSize: 10,
            height: 16,
            lineHeight: '16px',
            padding: '0 6px',
          }}
        />
      </Space>

      <Space size="middle">
        {/* Create Voting Button - Always visible */}
        <Tooltip title="Create a new voting (Admin only for now)">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/create')}
            style={{
              background: '#2563EB',
              borderColor: '#2563EB',
            }}
          >
            Create Voting
          </Button>
        </Tooltip>

        {/* Theme Toggle */}
        <Switch
          checked={isDarkMode}
          onChange={onThemeToggle}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
        />

        {/* Wallet Connection */}
        {wallet ? (
          <Dropdown menu={{ items: walletMenuItems }} placement="bottomRight">
            <Button 
              type="primary"
              icon={<Avatar size="small" icon={<UserOutlined />} />}
              style={{
                background: '#2563EB',
                borderColor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {shortenAddress(wallet.address)}
              {wallets.length > 1 && (
                <Badge 
                  count={wallets.length} 
                  style={{ 
                    backgroundColor: '#10B981',
                    marginLeft: 4,
                  }}
                />
              )}
            </Button>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            icon={<WalletOutlined />}
            onClick={onConnect}
            loading={false}
            style={{
              background: '#2563EB',
              borderColor: '#2563EB',
            }}
          >
            Connect Wallet
          </Button>
        )}
      </Space>
    </Header>
  );
};