import React from 'react';
import { Button } from 'antd';
import { ArrowRightOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const LandingCTA: React.FC = () => {
  const navigate = useNavigate();

  const handleStartVoting = () => {
    navigate('/dashboard');
  };

  return (
    <section style={{
      padding: '96px 0',
      position: 'relative',
      overflow: 'hidden',
      background: '#0F172A',
    }}>
      {/* Background effects */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: '25%',
          width: '384px',
          height: '384px',
          background: 'rgba(99, 102, 241, 0.2)',
          borderRadius: '50%',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: '25%',
          width: '384px',
          height: '384px',
          background: 'rgba(139, 92, 246, 0.2)',
          borderRadius: '50%',
          filter: 'blur(80px)',
        }} />
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          padding: 'clamp(48px, 8vw, 80px)',
          borderRadius: '16px',
          textAlign: 'center',
          maxWidth: '900px',
          margin: '0 auto',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 0 60px rgba(139, 92, 246, 0.3)',
        }}>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 700,
            marginBottom: '24px',
            color: '#fff',
          }}>
            Ready to Revolutionize <span style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Voting</span>?
          </h2>
          <p style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '40px',
            maxWidth: '700px',
            margin: '0 auto 40px',
          }}>
            Join the future of privacy-preserving democracy powered by Zama's revolutionary FHE technology.
            Experience true vote privacy with verifiable transparency.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth < 640 ? 'column' : 'row',
            gap: '16px',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Button
              type="primary"
              size="large"
              onClick={handleStartVoting}
              style={{
                height: '48px',
                padding: '0 32px',
                fontSize: '16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
              }}
              icon={<ArrowRightOutlined />}
              iconPosition="end"
            >
              Start Voting Now
            </Button>
            <Button
              size="large"
              style={{
                height: '48px',
                padding: '0 32px',
                fontSize: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
              icon={<MailOutlined />}
            >
              Contact Us
            </Button>
          </div>

          <p style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '32px',
            margin: '32px 0 0',
          }}>
            Open Source • Fully Decentralized • Enterprise Ready
          </p>
        </div>
      </div>
    </section>
  );
};

export default LandingCTA;
