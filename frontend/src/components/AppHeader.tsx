import React from 'react';
import { Layout, Button, Space, Avatar, Dropdown, Switch, Badge, Typography } from 'antd';
import {
  WalletOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  SafetyOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { shortenAddress } from '../utils/wallet';

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  wallet: any;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  wallet,
  isDarkMode,
  onThemeToggle,
  onConnect,
  onDisconnect,
}) => {
  const navigate = useNavigate();

  const userMenuItems = [
    {
      key: 'wallet',
      icon: <WalletOutlined />,
      label: (
        <Space direction="vertical" size={4}>
          <Text strong>Wallet Address</Text>
          <Text type="secondary" copyable={{ text: wallet?.address }}>
            {wallet?.address ? shortenAddress(wallet.address) : ''}
          </Text>
        </Space>
      ),
      disabled: true,
    },
    {
      key: 'balance',
      icon: <DollarOutlined />,
      label: (
        <Space>
          <Text>Balance:</Text>
          <Text strong>{wallet?.balance ? `${wallet.balance.slice(0, 8)} ETH` : '0 ETH'}</Text>
        </Space>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'disconnect',
      icon: <LogoutOutlined />,
      label: 'Disconnect',
      onClick: onDisconnect,
      danger: true,
    },
  ];

  return (
    <Header
      style={{
        background: isDarkMode ? '#1A1F27' : '#FFFFFF',
        borderBottom: `1px solid ${isDarkMode ? '#2D3748' : '#E5E7EB'}`,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Space size={24} align="center">
        <div
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            gap: 12,
          }}
          onClick={() => navigate('/')}
        >
          <img src="/icon_monogram_hv.svg" alt="HushVote" style={{ width: 32, height: 32 }} />
          <Text strong style={{ fontSize: 18, margin: 0 }}>
            HushVote
          </Text>
        </div>
        
        <Badge 
          count="Privacy First" 
          style={{ 
            backgroundColor: '#10B981',
            fontSize: 11,
            height: 20,
            lineHeight: '20px',
            borderRadius: 4,
          }} 
        />
      </Space>

      <Space size={16}>
        <Switch
          checked={isDarkMode}
          onChange={onThemeToggle}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
        />

        {wallet ? (
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button
              type="text"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 40,
                padding: '0 12px',
                border: `1px solid ${isDarkMode ? '#2D3748' : '#E5E7EB'}`,
              }}
            >
              <Avatar
                size={24}
                style={{ backgroundColor: '#2563EB' }}
                icon={<UserOutlined />}
              />
              <Space size={4}>
                <Text strong>{shortenAddress(wallet.address)}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {wallet.balance.slice(0, 6)} ETH
                </Text>
              </Space>
            </Button>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            icon={<WalletOutlined />}
            onClick={onConnect}
            style={{ height: 40 }}
          >
            Connect Wallet
          </Button>
        )}
      </Space>
    </Header>
  );
};
