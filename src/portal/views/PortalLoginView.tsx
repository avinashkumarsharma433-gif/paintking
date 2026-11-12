import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { normalizePortalEmail } from '../utils/portalAuth';

interface PortalLoginViewProps {
  onBackToWebsite: () => void;
  externalError?: string | null;
}

export const PortalLoginView: React.FC<PortalLoginViewProps> = ({
  onBackToWebsite,
  externalError,
}) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const normalizedPreview = normalizePortalEmail(loginId);
  const displayError = formError || externalError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const email = normalizePortalEmail(loginId);
    if (!email) {
      setFormError('Please enter your @paintking.in login ID.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setFormError(error.message || 'Invalid login ID or password.');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to reach authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafb] text-[#17191c] flex flex-col justify-between p-4 sm:p-8 font-sans antialiased">
      {/* Top Bar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToWebsite}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#ececec] bg-white hover:bg-[#f2f2f3] text-[#17191c] text-xs font-semibold transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#777b86]" />
          <span>Main Website</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-bold uppercase tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5 text-[#c09748]" />
          <span>PK-OS Secured Access</span>
        </div>
      </div>

      {/* Centered Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-white rounded-[24px] border border-[#ececec] shadow-[0_20px_50px_rgba(23,25,28,0.06)] p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <img src="/logo.svg" alt="PaintKing" className="h-9 w-auto mx-auto" />
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748] pt-1">
              PaintKing Operations OS
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-[#17191c]">
              Staff Portal Sign In
            </h1>
            <p className="text-xs text-[#777b86] leading-relaxed">
              Sign in with your assigned <span className="font-mono font-semibold text-[#17191c]">@paintking.in</span> ID. Plant &amp; module permissions are loaded automatically.
            </p>
          </div>

          {displayError && (
            <div className="p-3.5 rounded-[16px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#17191c] font-mono">
                Login ID or @paintking.in Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#777b86] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={loginId}
                  onChange={e => {
                    setLoginId(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. admin or ram.gate@paintking.in"
                  className="w-full h-11 pl-10 pr-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] focus:bg-white text-xs text-[#17191c] font-medium focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/20 focus:outline-none transition"
                />
              </div>
              {loginId.trim() && !loginId.includes('@') && (
                <div className="text-[11px] font-mono text-[#8a6521] pl-1">
                  Signing in as: <strong>{normalizedPreview}</strong>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#17191c] font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#777b86] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Enter your password"
                  className="w-full h-11 pl-10 pr-11 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] focus:bg-white text-xs text-[#17191c] font-medium focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/20 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#777b86] hover:text-[#17191c] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-full bg-[#c09748] hover:bg-[#a97e35] disabled:opacity-60 text-[#17191c] font-semibold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Operations OS</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-[#f2f2f3] text-center text-[11px] text-[#777b86]">
            Accounts are provisioned exclusively by the <strong className="text-[#17191c]">Super Admin</strong>. Contact administration for password resets or module access.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto text-center text-[11px] font-mono text-[#979799]">
        ISO 9001:2015 &amp; IATF-16949 Controlled ERP • Protected by Supabase Auth &amp; Row-Level Security
      </div>
    </div>
  );
};
