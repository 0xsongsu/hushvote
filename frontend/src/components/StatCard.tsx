import React from 'react';
import { Card, Statistic, Space, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  description?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  description,
  color = '#2563EB',
}) => {
  return (
    <Card
      style={{
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}
      styles={{
        body: { padding: 24 },
      }}
      hoverable
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
          {title}
        </Text>
        
        <Statistic
          value={value}
          prefix={prefix}
          suffix={suffix}
          valueStyle={{ 
            fontSize: 32, 
            fontWeight: 600,
            color,
            lineHeight: 1.2,
          }}
        />

        {(trend || description) && (
          <Space size={12} align="center">
            {trend && (
              <Space size={4} align="center">
                {trend.isUp ? (
                  <ArrowUpOutlined style={{ color: '#10B981', fontSize: 12 }} />
                ) : (
                  <ArrowDownOutlined style={{ color: '#EF4444', fontSize: 12 }} />
                )}
                <Text 
                  style={{ 
                    color: trend.isUp ? '#10B981' : '#EF4444',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {trend.value}%
                </Text>
              </Space>
            )}
            {description && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {description}
              </Text>
            )}
          </Space>
        )}
      </Space>
    </Card>
  );
};