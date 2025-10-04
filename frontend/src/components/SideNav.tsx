import React from 'react';
import { Layout, Menu, Badge } from 'antd';
import {
  DashboardOutlined,
  PlusCircleOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  TeamOutlined,
  SettingOutlined,
  SafetyOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;

interface SideNavProps {
  collapsed: boolean;
  isAdmin: boolean;
}

export const SideNav: React.FC<SideNavProps> = ({ collapsed, isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/votings?tab=all',
      icon: <CheckCircleOutlined />,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Votings
          <Badge status="success" style={{ marginLeft: 'auto' }} />
        </span>
      ),
    },
    {
      key: '/admin/create',
      icon: <PlusCircleOutlined />,
      label: 'Create Voting',
      style: { color: '#2563EB', fontWeight: 600 },
    },
    {
      key: '/votings?tab=ended',
      icon: <HistoryOutlined />,
      label: 'Voting History',
    },
    {
      key: '/votings?tab=tallied',
      icon: <BarChartOutlined />,
      label: 'Results',
    },
    ...(isAdmin ? [
      {
        type: 'divider' as const,
      },
      {
        key: 'admin',
        icon: <SafetyOutlined />,
        label: 'Admin Tools',
        children: [
          {
            key: '/admin/manage',
            icon: <TeamOutlined />,
            label: 'Manage Votings',
          },
          {
            key: '/admin/settings',
            icon: <SettingOutlined />,
            label: 'Settings',
          },
        ],
      },
    ] : []),
  ];

  const renderMenuItem = (item: any) => {
    if (item.type === 'divider') {
      return { type: 'divider', key: `divider-${item.key}` };
    }

    const menuItem: any = {
      key: item.key,
      icon: item.icon,
      label: item.badge ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {item.label}
          <Badge count={item.badge} style={{ marginLeft: 'auto' }} />
        </span>
      ) : item.label,
      onClick: item.children ? undefined : () => navigate(item.key),
    };

    if (item.children) {
      menuItem.children = item.children.map((child: any) => ({
        key: child.key,
        icon: child.icon,
        label: child.label,
        onClick: () => navigate(child.key),
      }));
    }

    return menuItem;
  };

  return (
    <Sider
      collapsed={collapsed}
      width={240}
      collapsedWidth={80}
      style={{
        borderRight: '1px solid #E5E7EB',
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 64,
        left: 0,
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname + location.search]}
        defaultOpenKeys={['admin']}
        style={{ 
          height: '100%', 
          borderRight: 0,
          padding: '8px 0',
        }}
        items={menuItems.map(renderMenuItem)}
      />
    </Sider>
  );
};
