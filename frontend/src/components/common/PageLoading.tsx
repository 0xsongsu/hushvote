import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface PageLoadingProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
  fullPage?: boolean;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  tip = 'Loading...',
  size = 'large',
  fullPage = true,
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 48 : size === 'default' ? 32 : 24 }} spin />;

  const containerStyle: React.CSSProperties = fullPage
    ? {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 128px)',
        padding: 48,
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
      };

  return (
    <div style={containerStyle}>
      <Spin indicator={antIcon} size={size} tip={tip}>
        <div style={{ padding: 50 }} />
      </Spin>
    </div>
  );
};

export default PageLoading;
