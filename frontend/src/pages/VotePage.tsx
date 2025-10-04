import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Space,
  Typography,
  Radio,
  Checkbox,
  Button,
  InputNumber,
  Progress,
  Alert,
  Divider,
  Row,
  Col,
  Spin,
  message,
  Modal,
  Tag,
} from 'antd';
import {
  LockOutlined,
  CheckOutlined,
  SafetyOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { EncryptionStatus } from '../components/EncryptionStatus';
import { useFHE } from '../hooks/useFHE';
import { useWallet } from '../hooks/useWallet';
import { getVotingFrom as getVotingOnchainFrom, castVote as castVoteOnchain, castWeightedVote as castWeightedVoteOnchain, castQuadraticVote as castQuadraticVoteOnchain, getStatusFrom } from '../services/contractService';
import { VotingType, VotingOption } from '../types';
import { RELAYER_CONFIG } from '../utils/fhe';
import { CONTRACT_ADDRESSES, SUPPORTED_CHAINS } from '../config/contracts';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export const VotePage: React.FC = () => {
  const { id, source } = useParams<{ id: string, source?: 'ballot' | 'quadratic' }>();
  const navigate = useNavigate();
  const { wallet, isConnected } = useWallet();
  const { isInitialized, encrypt, encryptWeighted } = useFHE();
  
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [quadraticCredits, setQuadraticCredits] = useState<Record<string, number>>({});
  const [encryptionStatus, setEncryptionStatus] = useState<
    'initializing' | 'ready' | 'encrypting' | 'encrypted' | 'error'
  >(isInitialized ? 'ready' : 'initializing');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: voting, isLoading } = useQuery({
    queryKey: ['voting-onchain', id, source],
    queryFn: async () => {
      const vid = Number(id);
      const v = await getVotingOnchainFrom((source as any) || 'ballot', vid);
      // Map contract shape to UI shape
      const typeNum = v.votingType ?? 0;
      const typeMap: Record<number, VotingType> = {
        0: VotingType.SINGLE_CHOICE,
        1: VotingType.MULTIPLE_CHOICE,
        2: VotingType.WEIGHTED,
        3: VotingType.QUADRATIC,
      };
      const uiOptions: VotingOption[] = (v.options || []).map((name, idx) => ({
        id: String(idx),
        label: String(name),
      }));
      return {
        id: String(v.id),
        title: v.title,
        description: v.description,
        type: typeMap[typeNum] ?? VotingType.SINGLE_CHOICE,
        status: undefined,
        options: uiOptions,
        startTime: String((Number(v.startTime) || 0) * 1000),
        endTime: String((Number(v.endTime) || 0) * 1000),
        createdBy: '',
        totalVoters: v.totalVotes,
        allowReencryption: false,
        createdAt: '',
        updatedAt: '',
      };
    },
    enabled: !!id,
  });

  const submitVoteMutation = useMutation({
    mutationFn: async () => {
      if (!voting || !wallet) throw new Error('Missing data');
      
      setEncryptionStatus('encrypting');
      
      try {
        // Pre-check on-chain status for clearer UX
        const status = await getStatusFrom((source as any) || 'ballot', Number(id));
        if (status !== 1) {
          throw new Error('Voting not active yet. Please wait for start.');
        }
        // Encrypt the vote based on voting type
        let encryptedData: any;
        // Resolve dApp contract address for encryption (ballot vs quadratic)
        const contractAddr = (source === 'quadratic')
          ? CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].FHEQuadraticVoting
          : CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].FHEBallot;
        const userAddr = wallet.address;
        
        if (voting.type === VotingType.SINGLE_CHOICE) {
          const optionIndex = voting.options.findIndex(o => o.id === selectedOptions[0]);
          encryptedData = await encrypt(optionIndex, contractAddr, userAddr);
        } else if (voting.type === VotingType.WEIGHTED) {
          const optionIndex = voting.options.findIndex(o => o.id === selectedOptions[0]);
          const weight = weights[selectedOptions[0]] || 1;
          encryptedData = await encryptWeighted(optionIndex, weight, contractAddr, userAddr);
        } else if (voting.type === VotingType.QUADRATIC) {
          // Build arrays for encryptedVotes and credits
          const creditsArr: number[] = voting.options.map((opt) => quadraticCredits[opt.id] || 0);
          // 使用单次打包多变量的加密，确保 proof 覆盖所有 handles
          const { handles, proof } = await encryptMultipleOptions(contractAddr, userAddr, voting.options.length);
          await castQuadraticVoteOnchain(Number(id), handles, creditsArr, proof);
          encryptedData = handles;
        }
        
        // 从 relayer 获取的 inputProof（单选/加权场景）
        let proof: string | undefined = undefined;
        if (voting.type === VotingType.SINGLE_CHOICE) {
          proof = (encryptedData as any).proof || undefined;
          encryptedData = (encryptedData as any).handle;
        } else if (voting.type === VotingType.WEIGHTED) {
          proof = (encryptedData as any).choice?.proof || undefined;
          encryptedData = (encryptedData as any).choice?.handle || (encryptedData as any).handle;
        }

        // Submit on-chain
        const votingIdNum = Number(id);
        if (voting.type === VotingType.SINGLE_CHOICE) {
          await castVoteOnchain(votingIdNum, encryptedData as string, proof);
        } else if (voting.type === VotingType.WEIGHTED) {
          const optId = selectedOptions[0];
          const weight = weights[optId] || 1;
          await castWeightedVoteOnchain(
            votingIdNum,
            (encryptedData as string),
            weight,
            proof
          );
        } else {
          throw new Error('This voting type is not supported yet in on-chain submission');
        }
        
        setEncryptionStatus('encrypted');
        return true;
      } catch (error: any) {
        setEncryptionStatus('error');
        const reason = error?.shortMessage || error?.reason || error?.message || 'Failed to submit vote';
        throw new Error(reason);
      }
    },
    onSuccess: () => {
      message.success('Vote submitted successfully!');
      setTimeout(() => {
        navigate('/votings');
      }, 2000);
    },
    onError: (err: any) => {
      message.error(err?.message || 'Failed to submit vote');
    },
  });

  useEffect(() => {
    if (isInitialized && encryptionStatus === 'initializing') {
      setEncryptionStatus('ready');
    }
  }, [isInitialized, encryptionStatus]);

  const handleSingleChoice = (optionId: string) => {
    setSelectedOptions([optionId]);
  };

  const handleMultipleChoice = (optionId: string, checked: boolean) => {
    if (checked) {
      setSelectedOptions([...selectedOptions, optionId]);
    } else {
      setSelectedOptions(selectedOptions.filter(id => id !== optionId));
    }
  };

  const handleWeightChange = (optionId: string, weight: number) => {
    setWeights({ ...weights, [optionId]: weight });
  };

  const handleQuadraticCredits = (optionId: string, credits: number) => {
    const votes = Math.floor(Math.sqrt(credits));
    setQuadraticCredits({ ...quadraticCredits, [optionId]: credits });
  };

  const getTotalQuadraticCredits = () => {
    return Object.values(quadraticCredits).reduce((sum, credits) => sum + credits, 0);
  };

  const handleSubmit = () => {
    if (!isConnected) {
      message.warning('Please connect your wallet first');
      return;
    }
    
    if (selectedOptions.length === 0) {
      message.warning('Please select at least one option');
      return;
    }
    
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    await submitVoteMutation.mutateAsync();
  };

  if (isLoading || !voting) {
    return (
      <Content style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </Content>
    );
  }

  const renderVotingOptions = () => {
    switch (voting.type) {
      case VotingType.SINGLE_CHOICE:
        return (
          <Radio.Group
            value={selectedOptions[0]}
            onChange={(e) => handleSingleChoice(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {voting.options.map((option) => (
                <Card
                  key={option.id}
                  hoverable
                  style={{
                    borderRadius: 8,
                    border: selectedOptions.includes(option.id)
                      ? '2px solid #2563EB'
                      : '1px solid #E5E7EB',
                  }}
                >
                  <Radio value={option.id} style={{ width: '100%' }}>
                    <Space direction="vertical" size={4}>
                      <Text strong>{option.label}</Text>
                      {option.description && (
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {option.description}
                        </Text>
                      )}
                    </Space>
                  </Radio>
                </Card>
              ))}
            </Space>
          </Radio.Group>
        );

      case VotingType.MULTIPLE_CHOICE:
        return (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {voting.options.map((option) => (
              <Card
                key={option.id}
                hoverable
                style={{
                  borderRadius: 8,
                  border: selectedOptions.includes(option.id)
                    ? '2px solid #2563EB'
                    : '1px solid #E5E7EB',
                }}
              >
                <Checkbox
                  checked={selectedOptions.includes(option.id)}
                  onChange={(e) => handleMultipleChoice(option.id, e.target.checked)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" size={4}>
                    <Text strong>{option.label}</Text>
                    {option.description && (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {option.description}
                      </Text>
                    )}
                  </Space>
                </Checkbox>
              </Card>
            ))}
          </Space>
        );

      case VotingType.WEIGHTED:
        return (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {voting.options.map((option) => (
              <Card
                key={option.id}
                style={{
                  borderRadius: 8,
                  border: weights[option.id] > 0
                    ? '2px solid #2563EB'
                    : '1px solid #E5E7EB',
                }}
              >
                <Row gutter={16} align="middle">
                  <Col flex="1">
                    <Space direction="vertical" size={4}>
                      <Text strong>{option.label}</Text>
                      {option.description && (
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {option.description}
                        </Text>
                      )}
                    </Space>
                  </Col>
                  <Col>
                    <Space align="center">
                      <Text>Weight:</Text>
                      <InputNumber
                        min={0}
                        max={100}
                        value={weights[option.id] || 0}
                        onChange={(value) => handleWeightChange(option.id, value || 0)}
                        style={{ width: 80 }}
                      />
                    </Space>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        );

      case VotingType.QUADRATIC:
        const maxCredits = voting.quadraticCredits || 100;
        const usedCredits = getTotalQuadraticCredits();
        const remainingCredits = maxCredits - usedCredits;

        return (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              message={
                <Space>
                  <Text>Credits remaining:</Text>
                  <Text strong>{remainingCredits} / {maxCredits}</Text>
                </Space>
              }
              type={remainingCredits < 0 ? 'error' : 'info'}
              showIcon
            />
            
            {voting.options.map((option) => {
              const credits = quadraticCredits[option.id] || 0;
              const votes = Math.floor(Math.sqrt(credits));
              
              return (
                <Card
                  key={option.id}
                  style={{
                    borderRadius: 8,
                    border: credits > 0
                      ? '2px solid #2563EB'
                      : '1px solid #E5E7EB',
                  }}
                >
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div>
                      <Text strong>{option.label}</Text>
                      {option.description && (
                        <Paragraph type="secondary" style={{ fontSize: 13, marginTop: 4 }}>
                          {option.description}
                        </Paragraph>
                      )}
                    </div>
                    
                    <Row gutter={16} align="middle">
                      <Col span={12}>
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Text type="secondary">Credits to spend:</Text>
                          <InputNumber
                            min={0}
                            max={remainingCredits + credits}
                            value={credits}
                            onChange={(value) => handleQuadraticCredits(option.id, value || 0)}
                            style={{ width: '100%' }}
                          />
                        </Space>
                      </Col>
                      <Col span={12}>
                        <Space direction="vertical" size={4}>
                          <Text type="secondary">Resulting votes:</Text>
                          <Tag color="blue" style={{ fontSize: 16, padding: '4px 12px' }}>
                            {votes} votes
                          </Tag>
                        </Space>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              );
            })}
          </Space>
        );

      default:
        return null;
    }
  };

  return (
    <Content style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {/* Header */}
        <Card style={{ borderRadius: 12 }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Title level={3} style={{ margin: 0 }}>
                {voting.title}
              </Title>
              <Paragraph type="secondary" style={{ marginTop: 8 }}>
                {voting.description}
              </Paragraph>
            </div>
            
            <Row gutter={16}>
              <Col span={8}>
                <Text type="secondary">Type:</Text>
                <br />
                <Text strong>
                  {voting.type.replace('_', ' ').toUpperCase()}
                </Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">Options:</Text>
                <br />
                <Text strong>{voting.options.length}</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">Ends:</Text>
                <br />
                <Text strong>
                  {Number(voting.endTime) ? new Date(Number(voting.endTime)).toLocaleString() : '—'}
                </Text>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* Encryption Status */}
        <EncryptionStatus
          status={encryptionStatus}
          progress={submitVoteMutation.isPending ? 50 : undefined}
        />

        {/* Voting Options */}
        <Card
          title="Cast Your Vote"
          style={{ borderRadius: 12 }}
          extra={
            voting.allowReencryption && (
              <Tag icon={<SafetyOutlined />} color="green">
                Verifiable
              </Tag>
            )
          }
        >
          {renderVotingOptions()}
        </Card>

        {/* Submit Button */}
        <Card style={{ borderRadius: 12 }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              message="Privacy Notice"
              description="Your vote will be encrypted using Fully Homomorphic Encryption before leaving your device. The vote remains encrypted throughout the entire process and can only be decrypted collectively after voting ends."
              type="info"
              showIcon
              icon={<LockOutlined />}
            />
            
            <Button
              type="primary"
              size="large"
              block
              onClick={handleSubmit}
              disabled={
                selectedOptions.length === 0 ||
                !isInitialized ||
                submitVoteMutation.isPending
              }
              loading={submitVoteMutation.isPending}
              icon={<CheckOutlined />}
            >
              {submitVoteMutation.isPending ? 'Encrypting & Submitting...' : 'Submit Encrypted Vote'}
            </Button>
          </Space>
        </Card>
      </Space>

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Your Vote"
        open={showConfirmModal}
        onOk={confirmSubmit}
        onCancel={() => setShowConfirmModal(false)}
        okText="Confirm & Encrypt"
        cancelText="Review Again"
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            message="Please review your selection"
            description="Once submitted, your vote cannot be changed."
            type="warning"
            showIcon
          />
          
          <div>
            <Text strong>Selected Options:</Text>
            <ul style={{ marginTop: 8 }}>
              {selectedOptions.map((optionId) => {
                const option = voting.options.find(o => o.id === optionId);
                return (
                  <li key={optionId}>
                    {option?.label}
                    {voting.type === VotingType.WEIGHTED && weights[optionId] && (
                      <Text type="secondary"> (Weight: {weights[optionId]})</Text>
                    )}
                    {voting.type === VotingType.QUADRATIC && quadraticCredits[optionId] && (
                      <Text type="secondary"> ({Math.floor(Math.sqrt(quadraticCredits[optionId]))} votes)</Text>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </Space>
      </Modal>
    </Content>
  );
};
