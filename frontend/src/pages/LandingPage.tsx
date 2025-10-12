import React from 'react';
import LandingHero from '../components/LandingHero';
import LandingFeatures from '../components/LandingFeatures';
import LandingHowItWorks from '../components/LandingHowItWorks';
import LandingCTA from '../components/LandingCTA';
import LandingFooter from '../components/LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#0F172A' }}>
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
};
