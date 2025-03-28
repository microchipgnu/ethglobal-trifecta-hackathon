import AnimatedBackground from '@/components/AnimatedBackground';
import CTASection from '@/components/CTASection';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import Navbar from '@/components/Navbar';
import TeamSection from '@/components/TeamSection';
import TokenInfo from '@/components/TokenInfo';
import React, { useEffect } from 'react';

const Index = () => {
  // Smooth scroll implementation
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      e.preventDefault();
      const elementId = href.slice(1);
      const element = document.getElementById(elementId);

      if (element) {
        window.scrollTo({
          behavior: 'smooth',
          top: element.offsetTop - 100, // Increased offset for fixed header to add more padding
        });
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  return (
    <div className="min-h-screen bg-base-dark-1 bg-grid-pattern text-white overflow-hidden">
      <AnimatedBackground />

      <Navbar />

      <main className="pt-4 relative">
        <HeroSection />
        <Features />
        <TokenInfo />
        <TeamSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
