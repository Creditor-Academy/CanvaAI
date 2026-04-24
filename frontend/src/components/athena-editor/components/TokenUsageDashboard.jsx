import React, { useState, useEffect } from 'react';
import { Card, Progress, Statistic, Row, Col, Tag, Button, Tooltip, Alert } from 'antd';
import { 
  ThunderboltOutlined, 
  DashboardOutlined, 
  TrendingUpOutlined,
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { getTokenNotification } from '../utils/realtimeTokenCounter';

/**
 * TokenUsageDashboard - User-facing token usage monitoring
 * Shows current usage, limits, costs, and smart recommendations
 */
const TokenUsageDashboard = ({ userTier = 'free' }) => {
  const [usage, setUsage] = useState({
    monthlyUsed: 0,
    dailyUsed: 0,
    totalRequests: 0,
    totalCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchUsageData();
  }, []);

  useEffect(() => {
    if (usage.monthlyUsed > 0) {
      const notif = getTokenNotification(usage, userTier);
      setNotification(notif);
    }
  }, [usage, userTier]);

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/text-editor/ai-usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsage({
          monthlyUsed: data.usage.totalTokens || 0,
          dailyUsed: 0, // TODO: Implement daily tracking
          totalRequests: data.usage.totalRequests || 0,
          totalCost: data.usage.totalCost || 0
        });
      }
    } catch (error) {
      console.error('[TokenUsageDashboard] Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const tierLimits = {
    free: { monthly: 10000, daily: 500, label: 'Free' },
    pro: { monthly: 100000, daily: 5000, label: 'Pro' },
    enterprise: { monthly: 1000000, daily: 50000, label: 'Enterprise' }
  };

  const limits = tierLimits[userTier] || tierLimits.free;
  const monthlyPercentage = (usage.monthlyUsed / limits.monthly) * 100;
  const remaining = limits.monthly - usage.monthlyUsed;

  const getStatusColor = (percentage) => {
    if (percentage > 90) return 'red';
    if (percentage > 75) return 'orange';
    if (percentage > 50) return 'blue';
    return 'green';
  };

  const formatTokens = (tokens) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  if (loading) {
    return (
      <Card loading title="Token Usage Dashboard">
        <p>Loading usage data...</p>
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f5f5f5' }}>
      <h2 style={{ marginBottom: '24px' }}>
        <DashboardOutlined style={{ marginRight: '8px' }} />
        Token Usage Dashboard
      </h2>

      {/* Smart Notification */}
      {notification && (
        <Alert
          message={notification.title}
          description={notification.message}
          type={notification.level === 'critical' ? 'error' : 
                notification.level === 'warning' ? 'warning' : 
                notification.level === 'info' ? 'info' : 'success'}
          icon={notification.level === 'critical' ? <WarningOutlined /> : <CheckCircleOutlined />}
          showIcon
          style={{ marginBottom: '24px' }}
          action={
            notification.action && (
              <Button size="small" type="primary">
                {notification.action}
              </Button>
            )
          }
        />
      )}

      {/* Main Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Monthly Usage"
              value={usage.monthlyUsed}
              suffix={`/ ${formatTokens(limits.monthly)}`}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: getStatusColor(monthlyPercentage) }}
            />
            <Progress 
              percent={monthlyPercentage.toFixed(1)} 
              status={monthlyPercentage > 90 ? 'exception' : monthlyPercentage > 75 ? 'normal' : 'active'}
              strokeColor={getStatusColor(monthlyPercentage)}
              style={{ marginTop: '16px' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Remaining"
              value={remaining}
              prefix={<TrendingUpOutlined />}
              valueStyle={{ color: remaining < 1000 ? '#ff4d4f' : '#52c41a' }}
            />
            <p style={{ marginTop: '8px', color: '#666' }}>
              {formatTokens(remaining)} tokens left
            </p>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={usage.totalRequests}
              prefix={<DashboardOutlined />}
            />
            <p style={{ marginTop: '8px', color: '#666' }}>
              AI generations this month
            </p>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Estimated Cost"
              value={usage.totalCost}
              precision={4}
              prefix={<DollarOutlined />}
              suffix="USD"
            />
            <p style={{ marginTop: '8px', color: '#666' }}>
              Based on gpt-4o-mini pricing
            </p>
          </Card>
        </Col>
      </Row>

      {/* Tier Info */}
      <Card title="Your Plan" style={{ marginBottom: '16px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Tag color="blue" style={{ fontSize: '16px', padding: '4px 12px' }}>
              {limits.label} Tier
            </Tag>
          </Col>
          <Col span={8}>
            <p><strong>Monthly Limit:</strong> {formatTokens(limits.monthly)} tokens</p>
          </Col>
          <Col span={8}>
            <p><strong>Daily Limit:</strong> {formatTokens(limits.daily)} tokens</p>
          </Col>
        </Row>
      </Card>

      {/* Recommendations */}
      <Card title="Recommendations">
        <ul style={{ lineHeight: '2' }}>
          {monthlyPercentage > 90 && (
            <li style={{ color: '#ff4d4f' }}>
              <WarningOutlined /> Consider upgrading to Pro for {formatTokens(limits.monthly * 10)} tokens/month
            </li>
          )}
          {monthlyPercentage > 75 && monthlyPercentage <= 90 && (
            <li style={{ color: '#fa8c16' }}>
              <WarningOutlined /> Monitor your usage - you're approaching your limit
            </li>
          )}
          {usage.totalRequests > 0 && (
            <li>
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
              Average: {formatTokens(usage.monthlyUsed / usage.totalRequests)} tokens per request
            </li>
          )}
          <li>
            <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
            Use cached prompts to save 50% on repeated inputs
          </li>
          <li>
            <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
            Shorter prompts = lower costs
          </li>
        </ul>
      </Card>

      {/* Action Buttons */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Button type="primary" size="large" style={{ marginRight: '12px' }}>
          Upgrade Plan
        </Button>
        <Button size="large" onClick={fetchUsageData}>
          Refresh Stats
        </Button>
      </div>
    </div>
  );
};

export default TokenUsageDashboard;
