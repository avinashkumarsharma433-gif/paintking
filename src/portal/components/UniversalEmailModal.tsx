import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  Paperclip, 
  FileText, 
  CheckCircle2, 
  Download, 
  Eye, 
  Sparkles, 
  AlertCircle,
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { EmailDispatchPayload } from '../utils/emailDispatchEngine';

interface UniversalEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: EmailDispatchPayload | null;
  onSendSuccess?: (sentTo: string) => void;
  onViewPdfAttachment?: () => void;
}

export const UniversalEmailModal: React.FC<UniversalEmailModalProps> = ({
  isOpen,
  onClose,
  payload,
  onSendSuccess,
  onViewPdfAttachment
}) => {
  if (!isOpen || !payload) return null;

  const [toEmail, setToEmail] = useState<string>(payload.toEmail || '');
  const [ccEmail, setCcEmail] = useState<string>(payload.ccEmail || '');
  const [subject, setSubject] = useState<string>(payload.subject || '');
  const [bodyText, setBodyText] = useState<string>(payload.bodyText || '');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (payload) {
      setToEmail(payload.toEmail || '');
      setCcEmail(payload.ccEmail || '');
      setSubject(payload.subject || '');
      setBodyText(payload.bodyText || '');
      setIsSending(false);
      setIsSent(false);
    }
  }, [payload]);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim()) {
      alert('Kripya Party / Vendor ka Email address enter karein.');
      return;
    }

    setIsSending(true);

    // Simulate reliable SMTP / Serverless Email Dispatch with natural network delay
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);

      setTimeout(() => {
        if (onSendSuccess) {
          onSendSuccess(toEmail);
        }
        onClose();
      }, 1400);
    }, 1100);
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(bodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsertCapaNote = () => {
    const capaNote = `\n\n[ACTION REQUIRED FOR SUPPLIER]:\nKindly submit a formal Root Cause & Corrective Action (CAPA) Report within 48 hours for our internal quality compliance audit.`;
    if (!bodyText.includes('[ACTION REQUIRED FOR SUPPLIER]')) {
      setBodyText(prev => prev + capaNote);
    }
  };

  const handleInsertShortageAlert = () => {
    const alertNote = `\n\n[COMMERCIAL NOTE]:\nPlease issue an amended Delivery Challan / Credit Note adjusting the shortage count recorded at our gate.`;
    if (!bodyText.includes('[COMMERCIAL NOTE]')) {
      setBodyText(prev => prev + alertNote);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-[24px] max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar relative animate-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#ececec]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#c09748]" />
                <span>{payload.documentType === 'IQC' ? 'IQC Inspection Report' : 'Gate Pass Notification'}</span>
              </span>
              <span className="font-mono text-xs text-[#777b86]">Ref: {payload.documentRef}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#17191c] flex items-center gap-1.5">
              <span>Email Report to Party</span>
              <span className="text-[#c09748] font-normal text-sm">({payload.recipientName})</span>
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="w-7 h-7 rounded-full bg-[#fafafb] hover:bg-[#ececec] flex items-center justify-center text-[#777b86] hover:text-[#17191c] cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Confirmation Screen */}
        {isSent ? (
          <div className="py-12 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-[#17191c]">Email Successfully Dispatched!</h4>
            <p className="text-xs text-[#777b86] max-w-sm mx-auto">
              Inspection report and official PDF attachment have been sent to{' '}
              <strong className="text-[#17191c] font-mono">{toEmail}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendEmail} className="space-y-3.5">
            {/* Row 1: To & CC Email Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#777b86] font-semibold uppercase tracking-wider mb-1">
                  Party / Vendor Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={toEmail}
                    onChange={e => setToEmail(e.target.value)}
                    placeholder="e.g. quality@vendor.com"
                    className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white font-mono text-xs text-[#17191c] focus:outline-none focus:border-[#17191c] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#777b86] font-semibold uppercase tracking-wider mb-1">
                  CC Internal Teams (Optional)
                </label>
                <input
                  type="text"
                  value={ccEmail}
                  onChange={e => setCcEmail(e.target.value)}
                  placeholder="e.g. purchase@paintking.in, stores@paintking.in"
                  className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white font-mono text-xs text-[#777b86] focus:outline-none focus:border-[#17191c] transition-colors"
                />
              </div>
            </div>

            {/* Row 2: Subject Line */}
            <div>
              <label className="block text-[10px] text-[#777b86] font-semibold uppercase tracking-wider mb-1">
                Email Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-[#fafafb] font-medium text-xs text-[#17191c] focus:outline-none focus:border-[#17191c] transition-colors"
              />
            </div>

            {/* Smart Body Content Editor with Quick Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="block text-[10px] text-[#777b86] font-semibold uppercase tracking-wider">
                  Auto-Drafted Executive Message Body
                </label>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={handleInsertCapaNote}
                    className="px-2 py-0.5 rounded-full bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#dcdfe4] cursor-pointer transition font-medium"
                  >
                    + Add CAPA Request
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertShortageAlert}
                    className="px-2 py-0.5 rounded-full bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#dcdfe4] cursor-pointer transition font-medium"
                  >
                    + Add Shortage Note
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyBody}
                    className="px-2 py-0.5 rounded-full bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#dcdfe4] cursor-pointer transition flex items-center gap-1"
                    title="Copy Text to Clipboard"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={9}
                value={bodyText}
                onChange={e => setBodyText(e.target.value)}
                className="w-full p-3 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] focus:bg-white text-[11.5px] font-mono leading-relaxed text-[#17191c] focus:outline-none focus:border-[#17191c] transition-colors resize-y"
              />
            </div>

            {/* Attached Document Strip */}
            <div className="p-3 rounded-[14px] bg-[#faf3e0]/60 border border-[#f4e5be] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white border border-[#f4e5be] flex items-center justify-center text-[#8a6521] shrink-0">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-mono font-bold text-xs text-[#17191c] truncate">
                    {payload.fileName}
                  </div>
                  <div className="text-[10px] text-[#777b86]">
                    Official Signed PDF Attachment (~185 KB) • Standard Layout
                  </div>
                </div>
              </div>

              {onViewPdfAttachment && (
                <button
                  type="button"
                  onClick={onViewPdfAttachment}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#fafafb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer flex items-center gap-1 transition shadow-2xs shrink-0"
                >
                  <Eye className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Preview PDF</span>
                </button>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-[#ececec]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="w-full sm:w-auto px-4 py-2 rounded-full border border-[#dcdfe4] text-xs font-semibold text-[#777b86] hover:bg-gray-50 cursor-pointer transition text-center"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-[#25282d] text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>Send Email to Party</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
