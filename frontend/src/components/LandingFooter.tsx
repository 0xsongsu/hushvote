import React from 'react';
import { GithubOutlined, TwitterOutlined, LinkedinOutlined } from '@ant-design/icons';

const LandingFooter: React.FC = () => {
  return (
    <footer style={{
      padding: '48px 0 32px',
      background: '#0B0F14',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
          gap: '48px',
          marginBottom: '48px',
        }}>
          {/* Brand */}
          <div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              HushVote
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: '1.6',
              marginBottom: '16px',
            }}>
              Privacy-preserving voting platform powered by Zama's Fully Homomorphic Encryption technology.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '20px',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}>
                <GithubOutlined />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '20px',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}>
                <TwitterOutlined />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '20px',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}>
                <LinkedinOutlined />
              </a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#fff',
              marginBottom: '16px',
            }}>
              Resources
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              {['Documentation', 'FHE Technology', 'API Reference', 'GitHub Repository'].map(item => (
                <li key={item} style={{ marginBottom: '12px' }}>
                  <a href="#" style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#fff',
              marginBottom: '16px',
            }}>
              Company
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              {['About Us', 'Contact', 'Privacy Policy', 'Terms of Service'].map(item => (
                <li key={item} style={{ marginBottom: '12px' }}>
                  <a href="#" style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          paddingTop: '32px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            margin: 0,
          }}>
            © 2025 HushVote. All rights reserved.
          </p>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            margin: 0,
          }}>
            Powered by <a href="https://www.zama.ai" target="_blank" rel="noopener noreferrer" style={{
              color: '#6366f1',
              textDecoration: 'none',
              fontWeight: 600,
            }}>Zama FHE</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
