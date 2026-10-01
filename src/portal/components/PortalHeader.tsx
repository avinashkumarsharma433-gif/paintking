import React, { useState, useRef, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { INITIAL_USER_PROFILES } from '../data/mockInitialData';
import { PlantLocation, ShiftType } from '../types/portalTypes';
import { AlertTriangle, ArrowLeft, Building2, Check, ChevronDown, Clock, Menu, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PortalHeaderProps {
  onBackToWebsite: () => void;
  onToggleMobileNav?: () => void;
  activeTabLabel?: string;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({ 
  onBackToWebsite,
  onToggleMobileNav,
  activeTabLabel 
}) => {
  const {
    currentUser,
    switchUser,
    activePlant,
    setActivePlant,
    activeShift,
    setActiveShift,
    unresolvedHandoversCount,
    openOverrunCount,
    isPlantDayClosed
  } = usePortalStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleSelectUser = (userId: string) => {
    switchUser(userId);
    setIsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl text-[#17191c] border-b border-[#ececec] px-3 sm:px-6 lg:px-8 py-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-3 sm:gap-4 max-w-[1600px] mx-auto w-full">
        {/* Left: Hamburger menu (mobile), Brand & Return */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          {/* Mobile Sidebar Drawer Toggle */}
          <button
            onClick={onToggleMobileNav}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-full border border-[#ececec] bg-[#fafafb] hover:bg-[#f2f2f3] text-[#17191c] cursor-pointer shadow-2xs shrink-0"
            title="Open workspace modules"
            aria-label="Open workspace modules"
          >
            <Menu className="w-4 h-4 text-[#c09748]" />
          </button>

          <button
            onClick={onBackToWebsite}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full border border-[#ececec] bg-[#fafafb] hover:bg-[#f2f2f3] hover:border-[#dfdfe2] text-[#17191c] text-xs font-semibold transition cursor-pointer shadow-2xs group shrink-0"
            title="Return to public PaintKing marketing website"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-[#777b86] group-hover:text-[#17191c]" />
            <span className="hidden sm:inline">Main Website</span>
            <span className="sm:hidden text-[11px]">Exit</span>
          </button>
          
          <div className="h-4 w-px bg-[#ececec] hidden sm:block" />

          <div className="flex items-center gap-2 shrink-0">
            <img 
              src="/logo.svg" 
              alt="PaintKing" 
              className="h-6 sm:h-8 w-auto object-contain" 
            />
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-bold tracking-widest uppercase font-mono hidden md:inline-flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-[#c09748]" />
              OPERATIONS OS
            </span>
          </div>

          {/* Active Tab Chip on Mobile */}
          {activeTabLabel && (
            <div className="lg:hidden hidden xs:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-bold truncate max-w-[120px] sm:max-w-[160px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c09748] shrink-0" />
              <span className="truncate">{activeTabLabel}</span>
            </div>
          )}
        </div>

        {/* Center: Plant, Shift & Real-Time Operational Alerts (Horizontal non-wrapping) */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {/* Active Plant Selector */}
          <div className="flex items-center bg-[#f2f2f3] rounded-full p-1 border border-[#ececec]">
            <Building2 className="w-3.5 h-3.5 text-[#c09748] ml-2 mr-1" />
            {(['Haridwar', 'Vasai'] as PlantLocation[]).map(plant => (
              <button
                key={plant}
                onClick={() => setActivePlant(plant)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                  activePlant === plant
                    ? 'bg-[#c09748] text-[#17191c] font-semibold shadow-xs'
                    : 'text-[#777b86] hover:text-[#17191c]'
                }`}
              >
                {plant}
              </button>
            ))}
          </div>

          {/* Plant Operating Shift Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f2f3] border border-[#ececec] text-xs">
            <Clock className="w-3.5 h-3.5 text-[#c09748]" />
            <span className="font-medium text-[#17191c]">Single Day Shift</span>
            <span className="text-[10px] text-[#777b86] font-mono">(08:30–18:30)</span>
          </div>

          {/* Plant EOD Shutdown Indicator */}
          {isPlantDayClosed ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span>EOD Locked</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Plant Active</span>
            </div>
          )}



          {/* Color Over-Run Alert Chip */}
          {openOverrunCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-xs font-bold">
              <span>{openOverrunCount} Color Over-run</span>
            </div>
          )}
        </div>

        {/* Right: Custom Persona Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border transition-all duration-200 cursor-pointer shadow-2xs ${
              isDropdownOpen 
                ? 'bg-white border-[#c09748] ring-2 ring-[#c09748]/20' 
                : 'bg-[#fafafb] hover:bg-[#f2f2f3] border-[#ececec]'
            }`}
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
            aria-label="Active User Persona Menu"
          >
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover ring-1.5 ring-[#c09748]"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-[#17191c] leading-tight flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-[10px] text-[#777b86] font-mono leading-none mt-0.5">
                {currentUser.roleTitle}
              </div>
            </div>

            <ChevronDown 
              className={`w-4 h-4 text-[#777b86] transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-[#c09748]' : ''
              }`} 
            />
          </button>

          {/* Luxury Floating Persona Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-[calc(100%+8px)] w-[calc(100vw-24px)] max-w-[360px] sm:w-[380px] bg-white rounded-[22px] border border-[#ececec] shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-2.5 z-50 overflow-hidden"
              >
                {/* Header */}
                <div className="px-3 py-2 border-b border-[#f2f2f3] mb-1.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#c09748] font-bold">
                      SWITCH ACTIVE PERSONA
                    </div>
                    <div className="text-[11px] text-[#777b86]">
                      Select role to test live department permissions
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-[#f2f2f3] text-[#777b86] px-2 py-0.5 rounded-full font-medium">
                    {INITIAL_USER_PROFILES.length} Roles
                  </span>
                </div>

                {/* Profiles List */}
                <div className="max-h-[360px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {INITIAL_USER_PROFILES.map((profile) => {
                    const isSelected = currentUser.id === profile.id;
                    return (
                      <button
                        key={profile.id}
                        onClick={() => handleSelectUser(profile.id)}
                        className={`w-full text-left p-2.5 rounded-[16px] transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer group ${
                          isSelected
                            ? 'bg-[#faf3e0] border border-[#f4e5be]'
                            : 'hover:bg-[#fafafb] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={profile.avatar}
                            alt={profile.name}
                            className={`w-9 h-9 rounded-full object-cover shrink-0 border ${
                              isSelected ? 'border-[#c09748] ring-1 ring-[#c09748]' : 'border-[#ececec]'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-semibold truncate ${
                                isSelected ? 'text-[#17191c]' : 'text-[#17191c] group-hover:text-[#c09748]'
                              }`}>
                                {profile.name}
                              </span>
                              <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded-full bg-[#f2f2f3] text-[#777b86] shrink-0">
                                {profile.plant}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#777b86] font-mono truncate">
                              {profile.roleTitle}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-[#8a6521] text-white'
                              : 'bg-[#f2f2f3] text-[#777b86]'
                          }`}>
                            {profile.role}
                          </span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#c09748] flex items-center justify-center text-white shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer Note */}
                <div className="mt-2 pt-2 border-t border-[#f2f2f3] px-2 flex items-center justify-between text-[11px] text-[#777b86]">
                  <span>Active Plant: <strong className="text-[#17191c] font-semibold">{activePlant}</strong></span>
                  <span>Shift: <strong className="text-[#17191c] font-semibold">{activeShift}</strong></span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Sub-strip for plant, shift & alerts (Clean, Horizontal Swipe, No Overflow Cut) */}
      <div className="flex lg:hidden items-center gap-2 mt-2 pt-2 border-t border-[#ececec]/80 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-3 px-3">
        <div className="flex items-center gap-0.5 bg-[#f2f2f3] rounded-full p-0.5 border border-[#ececec] shrink-0">
          <Building2 className="w-3 h-3 text-[#c09748] ml-1.5 mr-0.5" />
          {(['Haridwar', 'Vasai'] as PlantLocation[]).map(plant => (
            <button
              key={plant}
              onClick={() => setActivePlant(plant)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer shrink-0 ${
                activePlant === plant
                  ? 'bg-[#c09748] text-[#17191c] font-semibold shadow-2xs'
                  : 'text-[#777b86]'
              }`}
            >
              {plant}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 bg-[#f2f2f3] rounded-full p-0.5 border border-[#ececec] shrink-0">
          <Clock className="w-3 h-3 text-[#777b86] ml-1.5 mr-0.5" />
          {(['Day 12H', 'Night 12H'] as ShiftType[]).map(shift => (
            <button
              key={shift}
              onClick={() => setActiveShift(shift)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer shrink-0 ${
                activeShift === shift
                  ? 'bg-white text-[#17191c] font-semibold shadow-2xs'
                  : 'text-[#777b86]'
              }`}
            >
              {shift}
            </button>
          ))}
        </div>

        {unresolvedHandoversCount > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10.5px] font-bold shrink-0">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span>{unresolvedHandoversCount} Alert</span>
          </div>
        )}

        {openOverrunCount > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10.5px] font-bold shrink-0">
            <span>{openOverrunCount} Over-run</span>
          </div>
        )}
      </div>
    </header>
  );
};

