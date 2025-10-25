import React from 'react';
import { Button } from 'antd';
import { ArrowRightOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const LandingHero: React.FC = () => {
  const navigate = useNavigate();

  const handleOpenDApp = () => {
    navigate('/dashboard');
  };

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          width: '384px',
          height: '384px',
          background: 'rgba(99, 102, 241, 0.2)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'pulse 3s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '25%',
          right: '25%',
          width: '384px',
          height: '384px',
          background: 'rgba(139, 92, 246, 0.2)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'pulse 3s ease-in-out infinite 1s',
        }} />
      </div>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1200px',
        padding: '0 24px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '9999px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '32px',
        }}>
          <LockOutlined style={{ color: '#6366f1', fontSize: '16px' }} />
          <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
            Powered by Zama's Fully Homomorphic Encryption
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(48px, 10vw, 96px)',
          fontWeight: 700,
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          HushVote
        </h1>

        <p style={{
          fontSize: 'clamp(20px, 3vw, 28px)',
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: '16px',
          maxWidth: '900px',
          margin: '0 auto 16px',
        }}>
          Privacy-Preserving Voting with FHE Technology
        </p>

        <p style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '48px',
          maxWidth: '800px',
          margin: '0 auto 48px',
          lineHeight: '1.8',
        }}>
          Revolutionary decentralized voting platform powered by Zama's Fully Homomorphic Encryption (FHE).
          Vote remains encrypted during the entire voting process while still enabling accurate tallying.
          True privacy meets verifiable transparency.
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
            onClick={handleOpenDApp}
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
            Open DApp
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
          >
            Learn More
          </Button>
        </div>

        {/* Demo Video Section */}
        <div style={{
          marginTop: '64px',
          maxWidth: '900px',
          margin: '64px auto 0',
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '24px',
            textAlign: 'center',
          }}>
            See HushVote in Action
          </h3>
          <div style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
          }}>
            <video
              controls
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
              poster="/demo-poster.jpg"
            >
              <source src="/demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '16px',
            textAlign: 'center',
          }}>
            Watch a live demonstration of privacy-preserving voting with FHE
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </section>
  );
};

export default LandingHero;
