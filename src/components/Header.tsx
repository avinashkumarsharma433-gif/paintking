import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  activePage: string;
  navigateTo: (page: string, params?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ activePage, navigateTo }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'main' | 'services'>('main');
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset mobileView to main whenever menu is toggled
  useEffect(() => {
    if (!mobileOpen) {
      setMobileView('main');
    }
  }, [mobileOpen]);

  // Close desktop dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setServicesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { label: 'Home', id: 'home' },
    { label: 'Our Services', id: 'services', hasDropdown: true },
    { label: 'Gallery', id: 'gallery' },
    { label: 'Blog', id: 'blog' },
    { label: 'About Us', id: 'about' },
    { label: 'Careers', id: 'careers' },
    { label: 'Contact', id: 'contact' }
  ];

  const serviceSubmenu = [
    { label: 'Spray Painting', id: 'spray-painting' },
    { label: 'Hydrographic Printing', id: 'hydrographic' },
    { label: 'Digital Printing', id: 'digital' },
    { label: 'Injection Moulding', id: 'injection-molding' }
  ];

  return (
    <>
      {/* Sticky Header Capsule */}
      <div className="sticky top-0 z-50 w-full pointer-events-none">
        <header 
          id="site-header" 
          className="pointer-events-auto mx-auto mt-3 sm:mt-4 mb-1.5 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2.5rem)] max-w-6xl rounded-full border border-[#ececec] bg-white/95 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)] px-4.5 py-2.5 sm:px-6 sm:py-3 lg:px-7 lg:py-3.5 transition-all duration-300 relative"
        >
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <button 
              id="logo-button"
              onClick={() => { navigateTo('home'); setMobileOpen(false); }}
              className="flex items-center gap-2 group text-left cursor-pointer shrink-0"
            >
              <img 
                src="/logo.svg" 
                alt="PAINTKING Logo" 
                className="h-8 sm:h-9.5 lg:h-10 w-auto object-contain group-hover:opacity-90 transition-opacity duration-300"
                referrerPolicy="no-referrer"
              />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5 ml-auto">
              {menuItems.map((item) => {
                const isItemActive = activePage === item.id || 
                  (item.id === 'services' && ['spray-painting', 'hydrographic', 'digital', 'injection-molding'].includes(activePage));

                if (item.hasDropdown) {
                  return (
                    <div 
                      key={item.id}
                      className="relative"
                      ref={dropdownRef}
                      onMouseEnter={() => setServicesDropdownOpen(true)}
                      onMouseLeave={() => setServicesDropdownOpen(false)}
                    >
                      <button
                        id="services-menu-trigger"
                        onClick={() => {
                          setServicesDropdownOpen(!servicesDropdownOpen);
                        }}
                        className={`flex items-center gap-1 px-4 py-2 text-[13px] font-medium transition-all cursor-pointer rounded-full ${
                          isItemActive 
                            ? 'text-[#17191c] font-semibold bg-[#f2f2f3]' 
                            : servicesDropdownOpen 
                            ? 'text-[#17191c] bg-[#f2f2f3]' 
                            : 'text-[#777b86] hover:text-[#17191c] hover:bg-[#fafafb]'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown size={13} className={`transition-transform duration-300 ${servicesDropdownOpen ? 'rotate-180 text-[#c09748]' : 'text-[#a3a6af]'}`} />
                      </button>

                      {/* Styled Floating Dropdown Menu */}
                      <AnimatePresence>
                        {servicesDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-1/2 top-[calc(100%+0.2rem)] z-[130] w-[230px] -translate-x-1/2 pt-2"
                          >
                            <div className="overflow-hidden rounded-2xl border border-[#ececec] bg-white p-2 shadow-2xl">
                              {serviceSubmenu.map((sub) => {
                                const isSubActive = activePage === sub.id;
                                return (
                                  <button
                                    key={sub.id}
                                    onClick={() => {
                                      navigateTo(sub.id);
                                      setServicesDropdownOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-colors cursor-pointer ${
                                      isSubActive 
                                        ? 'bg-[#faf3e0] text-[#8a6521] font-semibold' 
                                        : 'text-[#17191c] hover:bg-[#f2f2f3]'
                                    }`}
                                  >
                                    <span>{sub.label}</span>
                                    {isSubActive && <div className="h-1.5 w-1.5 rounded-full bg-[#c09748]" />}
                                  </button>
                                );
                              })}
                              <div className="mt-1.5 border-t border-[#ececec] pt-1.5">
                                <button
                                  onClick={() => {
                                    navigateTo('services');
                                    setServicesDropdownOpen(false);
                                  }}
                                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-[12px] font-semibold text-[#c09748] hover:bg-[#faf3e0] transition-colors cursor-pointer"
                                >
                                  <span>Explore All Services →</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`px-4 py-2 text-[13px] font-medium transition-all cursor-pointer rounded-full ${
                      isItemActive 
                        ? 'text-[#17191c] font-semibold bg-[#f2f2f3]' 
                        : 'text-[#777b86] hover:text-[#17191c] hover:bg-[#fafafb]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              {/* Staff Portal Action Button */}
              <button
                onClick={() => navigateTo('portal')}
                className="ml-2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] hover:bg-[#c09748] hover:text-[#17191c] text-[12px] font-semibold tracking-wide transition shadow-xs cursor-pointer"
                title="Employee Operations Admin Portal"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#c09748] animate-pulse" />
                <span>Staff Portal</span>
              </button>
            </nav>

            {/* Morphing Hamburger-to-Cross Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-[#ececec] bg-[#f2f2f3] text-[#17191c] hover:bg-[#e5e5e7] lg:hidden cursor-pointer active:scale-95 transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              <div className="w-4 h-3.5 relative flex flex-col justify-between items-center pointer-events-none">
                <motion.span 
                  animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-[2px] bg-[#17191c] rounded-full origin-center block"
                />
                <motion.span 
                  animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="w-4 h-[2px] bg-[#17191c] rounded-full block"
                />
                <motion.span 
                  animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-[2px] bg-[#17191c] rounded-full origin-center block"
                />
              </div>
            </button>
          </div>

          {/* Smooth Dropdown Panel with Swipe View */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[calc(100%+0.6rem)] left-0 right-0 z-[120] bg-white/98 backdrop-blur-3xl overflow-hidden lg:hidden rounded-3xl border border-[#ececec] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] p-4"
              >
                <AnimatePresence initial={false} mode="wait">
                  {mobileView === 'main' ? (
                    /* MAIN MENU VIEW */
                    <motion.div
                      key="main-dropdown-view"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.18, ease: 'easeInOut' }}
                      className="flex flex-col gap-1"
                    >
                      {menuItems.map((item) => {
                        const isItemActive = activePage === item.id || 
                          (item.id === 'services' && ['spray-painting', 'hydrographic', 'digital', 'injection-molding'].includes(activePage));

                        if (item.hasDropdown) {
                          return (
                            <button
                              key={item.id}
                              onClick={() => setMobileView('services')}
                              className={`flex w-full items-center justify-between rounded-full px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                                isItemActive
                                  ? 'text-[#17191c] bg-[#f2f2f3] font-semibold'
                                  : 'text-[#777b86] hover:bg-[#fafafb]'
                              }`}
                            >
                              <span>{item.label}</span>
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#c09748] bg-[#faf3e0] px-2.5 py-0.5 rounded-full border border-[#f4e5be]">
                                <span>Services</span>
                                <ChevronRight size={13} />
                              </div>
                            </button>
                          );
                        }

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              navigateTo(item.id);
                              setMobileOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-full px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                              isItemActive 
                                ? 'text-[#17191c] bg-[#f2f2f3] font-semibold' 
                                : 'text-[#777b86] hover:text-[#17191c] hover:bg-[#fafafb]'
                            }`}
                          >
                            <span>{item.label}</span>
                            {isItemActive && <span className="w-1.5 h-1.5 rounded-full bg-[#c09748]" />}
                          </button>
                        );
                      })}

                      {/* Mobile Staff Portal Button */}
                      <div className="pt-2 mt-1 border-t border-[#ececec]">
                        <button
                          onClick={() => {
                            navigateTo('portal');
                            setMobileOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-full px-4 py-2.5 text-sm font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] hover:bg-[#c09748] hover:text-[#17191c] transition-all cursor-pointer shadow-xs"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#c09748] animate-pulse" />
                            <span>Staff Operations Portal</span>
                          </span>
                          <span className="text-[11px] font-mono text-[#8a6521]">PK-OS →</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    /* SERVICES SUBMENU VIEW (SWIPED) */
                    <motion.div
                      key="services-dropdown-view"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.18, ease: 'easeInOut' }}
                      className="flex flex-col gap-1"
                    >
                      {/* Back Button */}
                      <button
                        onClick={() => setMobileView('main')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#c09748] hover:bg-[#faf3e0] rounded-full w-fit mb-1 cursor-pointer transition-colors"
                      >
                        <ArrowLeft size={14} />
                        <span>Back to Main Menu</span>
                      </button>

                      {serviceSubmenu.map((sub) => {
                        const isSubActive = activePage === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              navigateTo(sub.id);
                              setMobileOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                              isSubActive 
                                ? 'bg-[#faf3e0] text-[#8a6521] font-semibold' 
                                : 'text-[#17191c] hover:bg-[#f2f2f3]'
                            }`}
                          >
                            <span>{sub.label}</span>
                            {isSubActive && <div className="h-1.5 w-1.5 rounded-full bg-[#c09748]" />}
                          </button>
                        );
                      })}

                      <div className="mt-1 pt-1.5 border-t border-[#ececec]">
                        <button
                          onClick={() => {
                            navigateTo('services');
                            setMobileOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-[#c09748] hover:bg-[#faf3e0] transition-colors cursor-pointer"
                        >
                          <span>Explore All Services →</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>
    </>
  );
};

