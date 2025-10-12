import React from 'react';
import { Card } from 'antd';
import {
  LockOutlined,
  EyeInvisibleOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  TeamOutlined
} from '@ant-design/icons';

const features = [
  {
    icon: LockOutlined,
    title: 'FHE-Powered Encryption',
    description: 'Utilizing Zama\'s Fully Homomorphic Encryption (FHE), votes remain encrypted throughout the entire process—from casting to tallying—ensuring ultimate privacy without sacrificing verifiability.',
  },
  {
    icon: EyeInvisibleOutlined,
    title: 'Compute on Encrypted Data',
    description: 'Revolutionary FHE technology enables vote counting directly on encrypted data. No decryption needed during tallying, making vote manipulation mathematically impossible.',
  },
  {
    icon: SafetyCertificateOutlined,
    title: 'Blockchain Immutability',
    description: 'Every encrypted vote is recorded on the blockchain as an immutable, timestamped transaction. FHE ensures that even on a public ledger, votes remain completely private.',
  },
  {
    icon: ThunderboltOutlined,
    title: 'Real-time FHE Tallying',
    description: 'Advanced FHE computation allows instant vote counting without revealing individual choices. Get real-time results while maintaining cryptographic guarantees of privacy.',
  },
  {
    icon: DatabaseOutlined,
    title: 'Privacy-First Architecture',
    description: 'Built on Zama\'s fhEVM, the world\'s first confidential smart contract protocol. Your vote data is encrypted at the protocol level, protected by cutting-edge cryptography.',
  },
  {
    icon: TeamOutlined,
    title: 'Verifiable & Anonymous',
    description: 'FHE\'s unique properties enable zero-knowledge verification: prove your vote was counted correctly without revealing how you voted. True privacy with complete auditability.',
  },
];

const LandingFeatures: React.FC = () => {
  return (
    <section style={{
      padding: '96px 0',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 700,
            marginBottom: '16px',
            color: '#fff',
          }}>
            Why Choose <span style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>HushVote</span>
          </h2>
          <p style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            Built on Zama's revolutionary FHE technology to enable true privacy-preserving computation
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
        }}>
          {features.map((feature, index) => (
            <Card
              key={index}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                animation: `fadeIn 0.6s ease-out ${index * 100}ms both`,
              }}
              bodyStyle={{ padding: '32px' }}
              hoverable
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(99, 102, 241, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                transition: 'transform 0.3s ease',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
              }}>
                <feature.icon style={{ fontSize: '28px', color: '#fff' }} />
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 600,
                marginBottom: '12px',
                color: '#fff',
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '15px',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.6',
                margin: 0,
              }}>
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default LandingFeatures;
