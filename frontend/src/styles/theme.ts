import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#2563EB',
    colorInfo: '#2563EB',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorBgLayout: '#F7F9FC',
    colorBgContainer: '#FFFFFF',
    colorTextBase: '#0F172A',
    colorBorder: '#E5E7EB',
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    borderRadius: 8,
    fontSize: 14,
    controlHeight: 36,
    lineWidth: 1,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      headerHeight: 64,
      siderBg: '#FFFFFF',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#EFF6FF',
      itemSelectedColor: '#2563EB',
      itemHoverBg: '#F3F4F6',
    },
    Button: {
      primaryShadow: '0 2px 0 rgba(37, 99, 235, 0.05)',
      defaultBorderColor: '#E5E7EB',
    },
    Card: {
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
      boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    },
    Table: {
      headerBg: '#F9FAFB',
      headerColor: '#4B5563',
      rowHoverBg: '#F9FAFB',
    },
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#2563EB',
    colorInfo: '#2563EB',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorBgBase: '#0B0F14',
    colorBgContainer: '#1A1F27',
    colorBgLayout: '#0B0F14',
    colorTextBase: '#E5E7EB',
    colorBorder: '#2D3748',
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    borderRadius: 8,
    fontSize: 14,
    controlHeight: 36,
    lineWidth: 1,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: '#1A1F27',
      headerHeight: 64,
      siderBg: '#1A1F27',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: 'rgba(37, 99, 235, 0.1)',
      itemSelectedColor: '#2563EB',
      itemHoverBg: 'rgba(255, 255, 255, 0.05)',
    },
    Button: {
      primaryShadow: '0 2px 0 rgba(0, 0, 0, 0.045)',
      defaultBorderColor: '#2D3748',
    },
    Card: {
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
      boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    },
    Table: {
      headerBg: '#252B36',
      headerColor: '#9CA3AF',
      rowHoverBg: '#252B36',
    },
  },
};
