import React, { useState, useRef, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { PlantLocation, ShiftType } from '../types/portalTypes';
import { supabase } from '../lib/supabaseClient';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ChevronDown,
  Clock,
  KeyRound,
  Lock,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PortalHeaderProps {
  onBackToWebsite: () => void;
  onToggleMobileNav?: () => void;
  activeTabLabel?: string;
}

const ALL_PLANTS: PlantLocation[] = ['Haridwar', 'Vasai', 'Vapi', 'Mumbai'];

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  onBackToWebsite,
  onToggleMobileNav,
  activeTabLabel,
}) => {
  const {
    currentUser,
    canSwitchPlant,
    logoutUser,
    activePlant,
    setActivePlant,
    activeShift,
    setActiveShift,
    unresolvedHandoversCount,
    openOverrunCount,
    isPlantDayClosed,
  } = usePortalStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwStatus, setPwStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null);
    if (newPassword.length < 8) {
      setPwStatus({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwStatus({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsUpdatingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPwStatus({ type: 'error', text: error.message });
      } else {
        setPwStatus({ type: 'success', text: 'Password updated successfully.' });
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPwStatus(null);
        }, 1200);
      }
    } finally {
      setIsUpdatingPw(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl text-[#17191c] border-b border-[#ececec] px-3 sm:px-6 lg:px-8 py-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-3 sm:gap-4 max-w-[1600px] mx-auto w-full">
        {/* Left: Hamburger menu (mobile), Brand & Return */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
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
            <img src="/logo.svg" alt="PaintKing" className="h-6 sm:h-8 w-auto object-contain" />
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-bold tracking-widest uppercase font-mono hidden md:inline-flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-[#c09748]" />
              OPERATIONS OS
            </span>
          </div>

          {activeTabLabel && (
            <div className="lg:hidden hidden xs:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-bold truncate max-w-[120px] sm:max-w-[160px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c09748] shrink-0" />
              <span className="truncate">{activeTabLabel}</span>
            </div>
          )}
        </div>

        {/* Center: Plant, Shift & Operational Alerts */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {canSwitchPlant ? (
            <div className="flex items-center bg-[#f2f2f3] rounded-full p-1 border border-[#ececec]">
              <Building2 className="w-3.5 h-3.5 text-[#c09748] ml-2 mr-1" />
              {ALL_PLANTS.map(plant => (
                <button
                  key={plant}
                  onClick={() => setActivePlant(plant)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                    activePlant === plant
                      ? 'bg-[#c09748] text-[#17191c] font-semibold shadow-xs'
                      : 'text-[#777b86] hover:text-[#17191c]'
                  }`}
                >
                  {plant}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-xs font-semibold text-[#8a6521]">
              <Building2 className="w-3.5 h-3.5 text-[#c09748]" />
              <span>{activePlant} Plant</span>
              <Lock className="w-3 h-3 text-[#8a6521]" />
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f2f3] border border-[#ececec] text-xs">
            <Clock className="w-3.5 h-3.5 text-[#c09748]" />
            <span className="font-medium text-[#17191c]">Single Day Shift</span>
            <span className="text-[10px] text-[#777b86] font-mono">(08:30–18:30)</span>
          </div>

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

          {openOverrunCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-xs font-bold">
              <span>{openOverrunCount} Color Over-run</span>
            </div>
          )}
        </div>

        {/* Right: Authenticated User Account Menu */}
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
            aria-label="Authenticated User Menu"
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
                {currentUser.email || currentUser.roleTitle}
              </div>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-[#777b86] transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-[#c09748]' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-[calc(100%+8px)] w-[calc(100vw-24px)] max-w-[320px] bg-white rounded-[22px] border border-[#ececec] shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-3.5 z-50 space-y-3"
              >
                <div className="pb-2.5 border-b border-[#f2f2f3] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#17191c] truncate">{currentUser.name}</span>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shrink-0">
                      {currentUser.role}
                    </span>
                  </div>
                  {currentUser.email && (
                    <div className="text-[11px] font-mono text-[#777b86] truncate">{currentUser.email}</div>
                  )}
                  <div className="text-[11px] text-[#777b86]">{currentUser.roleTitle}</div>
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-[#8a6521]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>
                      Assigned Plant:{' '}
                      <strong>
                        {currentUser.assignedPlant === 'ALL'
                          ? 'All Plants'
                          : currentUser.assignedPlant || activePlant}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full px-3.5 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>Change My Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logoutUser();
                    }}
                    className="w-full px-3.5 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out &amp; Clear Cache</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Sub-strip */}
      <div className="flex lg:hidden items-center gap-2 mt-2 pt-2 border-t border-[#ececec]/80 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-3 px-3">
        {canSwitchPlant ? (
          <div className="flex items-center gap-0.5 bg-[#f2f2f3] rounded-full p-0.5 border border-[#ececec] shrink-0">
            <Building2 className="w-3 h-3 text-[#c09748] ml-1.5 mr-0.5" />
            {ALL_PLANTS.map(plant => (
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
        ) : (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[11px] font-semibold text-[#8a6521] shrink-0">
            <Building2 className="w-3 h-3 text-[#c09748]" />
            <span>{activePlant}</span>
          </div>
        )}

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

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif font-normal text-[#17191c]">Change Password</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 rounded-full hover:bg-[#f2f2f3] text-[#777b86] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwStatus && (
              <div
                className={`p-3 rounded-[16px] text-xs border ${
                  pwStatus.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {pwStatus.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#777b86] mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] text-xs focus:bg-white focus:border-[#c09748] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#777b86] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] text-xs focus:bg-white focus:border-[#c09748] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-full bg-[#f2f2f3] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPw}
                  className="px-4 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold cursor-pointer"
                >
                  {isUpdatingPw ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
