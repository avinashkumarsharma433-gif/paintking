import React, { Component, useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { PortalProvider, usePortalStore, clearLocalPortalCache } from './context/PortalStoreContext';
import { PortalHeader } from './components/PortalHeader';
import { PortalSidebar, PortalTab, TAB_LABELS } from './components/PortalSidebar';
import { DashboardView } from './views/DashboardView';
import { JobCardsView } from './views/JobCardsView';
import { BillingView } from './views/BillingView';
import { StoresView } from './views/StoresView';
import { QAView } from './views/QAView';
import { PackingView } from './views/PackingView';
import { GatePassView } from './views/GatePassView';
import { HRSuiteView } from './views/HRSuiteView';
import { CalibrationView } from './views/CalibrationView';
import { PainterWorkspaceView } from './views/PainterWorkspaceView';
import { PortalLoginView } from './views/PortalLoginView';
import { UserManagementView } from './views/UserManagementView';
import { UserProfile } from './types/portalTypes';
import { supabase, fetchMyPortalProfile } from './lib/supabaseClient';
import { canAccessPortalTab, getDefaultTabForUser } from './utils/portalAuth';

interface PortalAppProps {
  onBackToWebsite: () => void;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  activeKey: string;
  onReset: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PortalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  declare state: ErrorBoundaryState;
  declare setState: (update: Partial<ErrorBoundaryState> | ((prevState: ErrorBoundaryState) => Partial<ErrorBoundaryState>)) => void;
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Portal Module Caught Error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.activeKey !== this.props.activeKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleClearCorruptedCache = () => {
    try {
      localStorage.removeItem('pk_hr_employees');
      localStorage.removeItem('pk_hr_attendance_records');
      localStorage.removeItem('pk_hr_leaves');
      localStorage.removeItem('pk_hr_unknown_attempts');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-8 bg-white rounded-[24px] border border-rose-200 shadow-sm max-w-xl mx-auto my-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto font-bold text-xl border border-rose-200">
            !
          </div>
          <h2 className="text-xl font-serif font-normal text-[#17191c]">Module Loading Exception Caught</h2>
          <p className="text-xs text-rose-700 font-mono leading-relaxed bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            {this.state.error?.message || 'An unexpected error occurred while rendering this module.'}
          </p>
          {this.state.error?.stack && (
            <div className="text-left bg-neutral-900 text-neutral-300 p-3 rounded-[16px] text-[10px] font-mono overflow-x-auto max-h-48 border border-neutral-700">
              <div className="text-amber-400 font-bold mb-1">Stack Trace:</div>
              <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset();
              }}
              className="px-5 py-2.5 rounded-full bg-[#c09748] text-[#17191c] font-bold text-xs cursor-pointer shadow-xs hover:bg-[#a97e35] transition"
            >
              Reset Module &amp; Return to Home
            </button>
            <button
              onClick={this.handleClearCorruptedCache}
              className="px-4 py-2.5 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239] font-semibold text-xs cursor-pointer hover:bg-[#ffe4e6] transition"
            >
              Clear HR Storage Cache &amp; Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const PortalInner: React.FC<PortalAppProps> = ({ onBackToWebsite }) => {
  const { currentUser } = usePortalStore();

  const [activeTab, setActiveTab] = useState<PortalTab>(() => {
    try {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (urlTab && urlTab in TAB_LABELS && canAccessPortalTab(currentUser, urlTab)) {
        return urlTab as PortalTab;
      }

      const savedTab = localStorage.getItem('pk_portal_active_tab');
      if (savedTab && savedTab in TAB_LABELS && canAccessPortalTab(currentUser, savedTab)) {
        return savedTab as PortalTab;
      }
    } catch {
      // fallback
    }
    return getDefaultTabForUser(currentUser) as PortalTab;
  });

  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const prevUserIdRef = useRef<string>(currentUser.id);

  useEffect(() => {
    try {
      localStorage.setItem('pk_portal_active_tab', activeTab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState(null, '', url.toString());
    } catch {
      // fallback
    }
  }, [activeTab]);

  useEffect(() => {
    if (prevUserIdRef.current !== currentUser.id) {
      prevUserIdRef.current = currentUser.id;
      setActiveTab(getDefaultTabForUser(currentUser) as PortalTab);
      setMobileNavOpen(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!canAccessPortalTab(currentUser, activeTab)) {
      setActiveTab(getDefaultTabForUser(currentUser) as PortalTab);
    }
  }, [currentUser, activeTab]);

  const renderTabById = (tab: PortalTab) => {
    switch (tab) {
      case 'dashboard':
        return <DashboardView onNavigateTab={(t) => { setActiveTab(t); setMobileNavOpen(false); }} />;
      case 'jobcards':
        return <JobCardsView />;
      case 'painter_desk':
        return <PainterWorkspaceView />;
      case 'billing':
        return <BillingView />;
      case 'stores':
        return <StoresView />;
      case 'qa':
        return <QAView />;
      case 'packing':
        return <PackingView />;
      case 'gatepass':
        return <GatePassView />;
      case 'hr_leave':
        return <HRSuiteView />;
      case 'calibration':
        return <CalibrationView />;
      case 'user_management':
        return <UserManagementView />;
      default:
        return <DashboardView onNavigateTab={(t) => { setActiveTab(t); setMobileNavOpen(false); }} />;
    }
  };

  const renderActiveTabContent = () => {
    if (!canAccessPortalTab(currentUser, activeTab)) {
      return renderTabById(getDefaultTabForUser(currentUser) as PortalTab);
    }
    return renderTabById(activeTab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafb] text-[#17191c] font-sans antialiased selection:bg-[#faf3e0] selection:text-[#8a6521]">
      <PortalHeader
        onBackToWebsite={onBackToWebsite}
        onToggleMobileNav={() => setMobileNavOpen(prev => !prev)}
        activeTabLabel={TAB_LABELS[activeTab] || 'Operations OS'}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <PortalSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (canAccessPortalTab(currentUser, tab)) {
              setActiveTab(tab);
              setMobileNavOpen(false);
            }
          }}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 max-w-7xl mx-auto w-full">
          <PortalErrorBoundary
            activeKey={activeTab}
            onReset={() => setActiveTab(getDefaultTabForUser(currentUser) as PortalTab)}
          >
            {renderActiveTabContent()}
          </PortalErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export const PortalApp: React.FC<PortalAppProps> = ({ onBackToWebsite }) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const authUserRef = useRef<UserProfile | null>(null);
  authUserRef.current = authUser;

  const loadAuthenticatedProfile = async (userId: string, silent = false) => {
    if (!silent) {
      setAuthLoading(true);
    }
    setAuthError(null);
    const res = await fetchMyPortalProfile(userId);
    if (!res.profile) {
      await supabase.auth.signOut();
      setAuthUser(null);
      setAuthError(res.error || 'User profile not found. Contact Super Admin.');
      setAuthLoading(false);
      return;
    }

    if (res.profile.isActive === false) {
      await supabase.auth.signOut();
      clearLocalPortalCache();
      setAuthUser(null);
      setAuthError('Your account has been suspended by the Super Admin.');
      setAuthLoading(false);
      return;
    }

    setAuthUser(res.profile);
    setAuthLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        loadAuthenticatedProfile(data.session.user.id, false);
      } else {
        setAuthUser(null);
        setAuthLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const isSameUser = authUserRef.current?.id === session.user.id;
        loadAuthenticatedProfile(session.user.id, isSameUser || event === 'TOKEN_REFRESHED');
      } else {
        setAuthUser(null);
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    clearLocalPortalCache();
    await supabase.auth.signOut();
    setAuthUser(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fafafb] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <img src="/logo.svg" alt="PaintKing" className="h-9 w-auto" />
        <Loader2 className="w-6 h-6 animate-spin text-[#c09748]" />
        <p className="text-xs font-mono text-[#777b86]">Verifying PaintKing Operations OS Session...</p>
      </div>
    );
  }

  if (!authUser) {
    return <PortalLoginView onBackToWebsite={onBackToWebsite} externalError={authError} />;
  }

  return (
    <PortalProvider authenticatedUser={authUser} onLogout={handleLogout}>
      <PortalInner onBackToWebsite={onBackToWebsite} />
    </PortalProvider>
  );
};
