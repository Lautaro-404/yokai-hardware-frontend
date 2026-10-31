import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ErrorBoundary from '../ui/ErrorBoundary';
import ConnectionBanner from '../ui/ConnectionBanner';

export default function MainLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface w-full max-w-full">
      <Header />
      <ConnectionBanner />
      <main className="w-full flex-1 pt-20 bg-surface relative">
        <div className="flex flex-col w-full relative z-10">
          {/* Ambient Gold, Vermilion & Pine Brush Glow Accents from Stitch Design */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden -z-10"
          >
            <div className="absolute top-0 right-1/4 w-[650px] h-[650px] bg-primary-container/10 rounded-full blur-[150px]" />
            <div className="absolute top-[700px] left-[-100px] w-[500px] h-[500px] bg-vermilion/10 rounded-full blur-[160px]" />
            <div className="absolute top-[1400px] right-[-50px] w-[600px] h-[600px] bg-pine/10 rounded-full blur-[170px]" />
          </div>
          <ErrorBoundary resetKey={pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
      <Footer />
    </div>
  );
}
