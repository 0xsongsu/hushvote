import React from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';

const steps = [
  {
    number: '01',
    title: 'Connect & Authenticate',
    description: 'Connect your Web3 wallet to securely authenticate. Your identity is verified on-chain while maintaining privacy through cryptographic proofs.',
  },
  {
    number: '02',
    title: 'Cast Encrypted Vote',
    description: 'Select your choices in our intuitive interface. Your vote is immediately encrypted using Zama\'s FHE technology before leaving your device—no one can see your choice, not even the system.',
  },
  {
    number: '03',
    title: 'FHE Computation On-Chain',
    description: 'Your encrypted vote is recorded on the fhEVM blockchain. Thanks to Fully Homomorphic Encryption, vote tallying happens directly on encrypted data without ever decrypting individual votes.',
  },
  {
    number: '04',
    title: 'Verify & Track Results',
    description: 'Receive a cryptographic proof of your vote submission. Real-time encrypted tallying provides instant results while zero-knowledge proofs let you verify your vote was counted—all without revealing your choice.',
  },
];

const LandingHowItWorks: React.FC = () => {
  return (
    <section style={{
      padding: '96px 0',
      position: 'relative',
      background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 700,
            marginBottom: '16px',
            color: '#fff',
          }}>
            How <span style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>HushVote</span> Works
          </h2>
          <p style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            A simple, secure process powered by revolutionary FHE cryptography
          </p>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {steps.map((step, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                display: 'flex',
                gap: '32px',
                marginBottom: index < steps.length - 1 ? '48px' : 0,
                animation: `fadeIn 0.6s ease-out ${index * 150}ms both`,
              }}
            >
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div style={{
                  position: 'absolute',
                  left: '32px',
                  top: '80px',
                  width: '2px',
                  height: 'calc(100% + 48px)',
                  background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3))',
                }} />
              )}

              {/* Step number */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '20px',
                  color: '#fff',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)',
                  transition: 'transform 0.3s ease',
                  flexShrink: 0,
                }}>
                  {step.number}
                </div>
              </div>

              {/* Content */}
              <div style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                padding: '32px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '12px',
                }}>
                  <CheckCircleOutlined style={{
                    fontSize: '24px',
                    color: '#6366f1',
                    marginTop: '4px',
                    flexShrink: 0,
                  }} />
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#fff',
                    margin: 0,
                  }}>
                    {step.title}
                  </h3>
                </div>
                <p style={{
                  fontSize: '16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.6',
                  margin: 0,
                  marginLeft: '36px',
                }}>
                  {step.description}
                </p>
              </div>
            </div>
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

export default LandingHowItWorks;
