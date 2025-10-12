import React, { useState } from 'react';
import {
  Layout,
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Button,
  Space,
  Typography,
  Alert,
  Row,
  Col,
  Divider,
  message,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  InfoCircleOutlined,
  LockOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createVoting } from '../services/contractService';
import { VotingType } from '../types';
import dayjs from 'dayjs';
import { useWallet } from '../hooks/useWallet';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export const CreateVoting: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [votingType, setVotingType] = useState<VotingType>(VotingType.SINGLE_CHOICE);
  const [loading, setLoading] = useState(false);
  const { wallet, isConnected } = useWallet();

  const handleSubmit = async (values: any) => {
    if (!isConnected) {
      message.error('Please connect your wallet first');
      return;
    }

    const [startTime, endTime] = values.dateRange;
    
    setLoading(true);
    try {
      // Convert dates to Unix timestamps
      // Ensure start time is at least 5 minutes in the future
      const now = Math.floor(Date.now() / 1000);
      let startTimeUnix = Math.floor(startTime.unix());
      const endTimeUnix = Math.floor(endTime.unix());
      
      // If start time is too close, adjust to 1 minute later for testing convenience
      if (startTimeUnix < now + 60) { // 1 minute buffer
        startTimeUnix = now + 60;
        message.info('Start time adjusted to 1 minute from now');
      }
      
      // Validate duration (must be at least 1 hour)
      const duration = endTimeUnix - startTimeUnix;
      if (duration < 3600) {
        message.error('Voting duration must be at least 1 hour');
        setLoading(false);
        return;
      }
      
      if (duration > 365 * 24 * 3600) {
        message.error('Voting duration cannot exceed 365 days');
        setLoading(false);
        return;
      }
      
      // Extract option labels and descriptions
      const optionLabels = values.options.map((opt: any) => opt.label);
      const optionDescriptions = values.options.map((opt: any) => opt.description || opt.label);
      
      // Convert voting type string to number for contract
      const votingTypeMap: { [key: string]: number } = {
        [VotingType.SINGLE_CHOICE]: 0,
        [VotingType.MULTIPLE_CHOICE]: 1,
        [VotingType.WEIGHTED]: 2,
        [VotingType.QUADRATIC]: 3,
      };
      const votingTypeNumber = votingTypeMap[values.type] || 0;
      
      // Call smart contract with updated parameters
      const votingId = await createVoting(
        values.title,
        values.description,
        optionLabels,
        optionDescriptions,
        startTimeUnix,
        endTimeUnix,
        votingTypeNumber
      );
      
      message.success('Voting created successfully on blockchain!');
      const source = votingTypeNumber === 3 ? 'quadratic' : 'ballot';
      navigate(`/vote/${source}/${votingId}`);
    } catch (error: any) {
      console.error('Failed to create voting:', error);
      message.error(error.message || 'Failed to create voting on blockchain');
    } finally {
      setLoading(false);
    }
  };

  const votingTypeOptions = [
    {
      value: VotingType.SINGLE_CHOICE,
      label: 'Single Choice',
      description: 'Voters can select only one option',
    },
    {
      value: VotingType.MULTIPLE_CHOICE,
      label: 'Multiple Choice',
      description: 'Voters can select multiple options',
    },
    {
      value: VotingType.WEIGHTED,
      label: 'Weighted Voting',
      description: 'Voters can assign weights to options',
    },
    {
      value: VotingType.QUADRATIC,
      label: 'Quadratic Voting',
      description: 'Voters spend credits, cost increases quadratically',
    },
  ];

  return (
    <Content style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {/* Header */}
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Create New Voting
          </Title>
          <Paragraph type="secondary">
            Set up a privacy-preserving voting session with FHE encryption
          </Paragraph>
        </div>

        {/* Privacy Notice */}
        <Alert
          message="Privacy-First Design"
          description="All votes will be encrypted using Fully Homomorphic Encryption. Individual votes remain private throughout the entire process, with results only revealed after collective decryption."
          type="info"
          showIcon
          icon={<LockOutlined />}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: VotingType.SINGLE_CHOICE,
            allowReencryption: true,
            decryptionThreshold: 3,
            quadraticCredits: 100,
            options: [
              { label: 'Option 1', description: '' },
              { label: 'Option 2', description: '' },
            ],
          }}
        >
          {/* Basic Information */}
          <Card title="Basic Information" style={{ borderRadius: 12, marginBottom: 24 }}>
            <Form.Item
              name="title"
              label="Voting Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input
                placeholder="Enter voting title"
                size="large"
                maxLength={100}
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter a description' }]}
            >
              <TextArea
                placeholder="Describe the purpose and context of this voting"
                rows={4}
                maxLength={500}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="Voting Type"
                  rules={[{ required: true }]}
                >
                  <Select
                    size="large"
                    onChange={setVotingType}
                    options={votingTypeOptions.map(opt => ({
                      value: opt.value,
                      label: (
                        <Space direction="vertical" size={0}>
                          <Text>{opt.label}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {opt.description}
                          </Text>
                        </Space>
                      ),
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="dateRange"
                  label="Voting Period"
                  rules={[{ required: true, message: 'Please select voting period' }]}
                  initialValue={[
                    dayjs().add(1, 'minute'),
                    dayjs().add(1, 'hour'),
                  ]}
                >
                  <RangePicker
                    size="large"
                    style={{ width: '100%' }}
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    disabledDate={(current) => current && current < dayjs()}
                  />
                </Form.Item>
              </Col>
            </Row>

            {votingType === VotingType.QUADRATIC && (
              <Form.Item
                name="quadraticCredits"
                label="Credits per Voter"
                extra="Total credits each voter can spend across all options"
              >
                <InputNumber
                  min={10}
                  max={1000}
                  style={{ width: 200 }}
                  size="large"
                />
              </Form.Item>
            )}
          </Card>

          {/* Voting Options */}
          <Card title="Voting Options" style={{ borderRadius: 12, marginBottom: 24 }}>
            <Form.List
              name="options"
              rules={[
                {
                  validator: async (_, options) => {
                    if (!options || options.length < 2) {
                      return Promise.reject(new Error('At least 2 options are required'));
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <Card
                      key={key}
                      size="small"
                      style={{ marginBottom: 16 }}
                      extra={
                        fields.length > 2 && (
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(name)}
                          >
                            Remove
                          </Button>
                        )
                      }
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'label']}
                            label={`Option ${index + 1} Label`}
                            rules={[{ required: true, message: 'Option label is required' }]}
                          >
                            <Input placeholder="Enter option label" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'description']}
                            label="Description (Optional)"
                          >
                            <Input placeholder="Brief description" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      size="large"
                    >
                      Add Option
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Card>

          {/* Security Settings */}
          <Card
            title="Security & Privacy Settings"
            style={{ borderRadius: 12, marginBottom: 24 }}
            extra={
              <Tag icon={<SafetyOutlined />} color="green">
                FHE Protected
              </Tag>
            }
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="allowReencryption"
                  label="Allow Vote Verification"
                  valuePropName="checked"
                  extra="Enable voters to verify their vote through reencryption"
                >
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="decryptionThreshold"
                  label="Decryption Threshold"
                  extra="Minimum participants needed for result decryption"
                >
                  <InputNumber min={1} max={10} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Form.Item
              name="eligibleVoters"
              label="Eligible Voters (Optional)"
              extra="Enter wallet addresses, one per line. Leave empty for open voting."
            >
              <TextArea
                placeholder="0x1234...&#10;0x5678...&#10;0xabcd..."
                rows={4}
              />
            </Form.Item>
          </Card>

          {/* Submit Buttons */}
          <Row gutter={16}>
            <Col span={12}>
              <Button
                size="large"
                block
                onClick={() => navigate('/admin/manage')}
              >
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button
                type="primary"
                size="large"
                block
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
              >
                Create Voting
              </Button>
            </Col>
          </Row>
        </Form>
      </Space>
    </Content>
  );
};
