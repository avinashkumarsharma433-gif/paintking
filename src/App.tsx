/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { OurServices } from './pages/OurServices';
import { SprayPainting } from './pages/SprayPainting';
import { Hydrographic } from './pages/Hydrographic';
import { DigitalPrinting } from './pages/DigitalPrinting';
import { InjectionMolding } from './pages/InjectionMolding';
import { Gallery } from './pages/Gallery';
import { AboutUs } from './pages/AboutUs';
import { ContactUs } from './pages/ContactUs';
import { Blog } from './pages/Blog';
import { Careers } from './pages/Careers';
import { PortalApp } from './portal/PortalApp';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<string>('home');
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Monitor scroll for back-to-top trigger
  useEffect(() => {
    const handleScroll = () => {
      // Toggle back to top button visibility
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent browser native ghost drag on images and links which freezes page scrolling
  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragstart', handleDragStart);
    return () => window.removeEventListener('dragstart', handleDragStart);
  }, []);

  // Multi-page fluid router state
  const navigateTo = (page: string) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Synchronize dynamic browser titles with the B2B website state
  useEffect(() => {
    const pageTitles: { [key: string]: string } = {
      'home': 'Innovative Kingdom of Paint & Print Solutions | PaintKing',
      'services': 'B2B Core Industrial Coating Solutions & Services | PaintKing',
      'spray-painting': 'High-Precision Spray Painting Services | PaintKing',
      'hydrographic': '3D Water Submersion Hydrographic Printing | PaintKing',
      'digital': 'Flatbed UV Direct Digital Printing | PaintKing',
      'injection-molding': 'High Volume Plastic Injection Molding | PaintKing',
      'gallery': 'Decorative Components Gallery & Showcase | PaintKing',
      'about': 'About Us & Board Of Directors | PaintKing',
      'contact': 'Request Free Sample & Bulk Estimate | PaintKing',
      'blog': 'Industrial Coating and Finishing Blogs Feed | PaintKing',
      'careers': 'Careers & Technical Operator Vacancies | PaintKing',
      'portal': 'Operations OS & Employee Admin Portal | PaintKing'
    };

    document.title = pageTitles[activePage] || 'PaintKing Website';
  }, [activePage]);

  // If viewing the internal Operations SaaS Portal, render full-screen portal shell
  if (activePage === 'portal') {
    return <PortalApp onBackToWebsite={() => navigateTo('home')} />;
  }

  const renderActivePage = () => {
    let pageContent;
    switch (activePage) {
      case 'home':
        pageContent = <Home navigateTo={navigateTo} />;
        break;
      case 'services':
        pageContent = <OurServices navigateTo={navigateTo} />;
        break;
      case 'spray-painting':
        pageContent = <SprayPainting navigateTo={navigateTo} />;
        break;
      case 'hydrographic':
        pageContent = <Hydrographic navigateTo={navigateTo} />;
        break;
      case 'digital':
        pageContent = <DigitalPrinting navigateTo={navigateTo} />;
        break;
      case 'injection-molding':
        pageContent = <InjectionMolding navigateTo={navigateTo} />;
        break;
      case 'gallery':
        pageContent = <Gallery navigateTo={navigateTo} />;
        break;
      case 'about':
        pageContent = <AboutUs navigateTo={navigateTo} />;
        break;
      case 'contact':
        pageContent = <ContactUs navigateTo={navigateTo} />;
        break;
      case 'blog':
        pageContent = <Blog navigateTo={navigateTo} />;
        break;
      case 'careers':
        pageContent = <Careers navigateTo={navigateTo} />;
        break;
      default:
        pageContent = <Home navigateTo={navigateTo} />;
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          {pageContent}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div id="site-shell" className="flex flex-col min-h-screen bg-[#FDFCF7] font-sans selection:bg-accent-300 selection:text-slate-900 text-slate-800 antialiased overflow-x-clip relative">
      
      {/* Primary Sticky Header */}
      <Header activePage={activePage} navigateTo={navigateTo} />

      {/* Main Render Panel */}
      <main id="main-viewports" className="flex-grow">
        {renderActivePage()}
      </main>

      {/* Bottom Footer segment */}
      <Footer navigateTo={navigateTo} />

      {/* Scroll to Top Trigger */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            id="scroll-to-top-button"
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 15 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 backdrop-blur border border-stone-200 shadow-xl text-slate-700 hover:text-accent-700 hover:border-accent-500/40 hover:bg-stone-50 transition-all duration-300 cursor-pointer active:scale-95"
            aria-label="Scroll to top"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Persistent WhatsApp Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="https://wa.me/919594591313"
          target="_blank"
          rel="noreferrer referrer"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl hover:bg-emerald-400 hover:scale-110 active:scale-95 transition-all duration-300 relative group"
          aria-label="Contact PaintKing WhatsApp support"
        >
          {/* Animated glow */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 scale-125 animate-ping -z-10" />
          <svg className="h-7 w-7 text-white fill-white" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.8.983 3.834 1.502 5.913 1.503h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Chat with PaintKing
          </div>
        </a>
      </div>

    </div>
  );
};

export default App;
