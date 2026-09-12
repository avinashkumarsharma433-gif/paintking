import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Download, FileText, CheckCircle, Sparkles } from 'lucide-react';

export const DownloadCatalogue: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      try {
        const link = document.createElement('a');
        link.href = '/Paintking_Redesigned_Catalogue.pdf';
        link.download = 'Paintking_Redesigned_Catalogue.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloaded(true);
      } catch (err) {
        console.error('Failed to download catalog:', err);
      } finally {
        setDownloading(false);
      }
    }, 800);
  };

  return (
    <section className="relative overflow-hidden bg-[#fafafb] border border-[#ececec] rounded-[24px] p-8 sm:p-12 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.04)]">
      <div className="absolute -right-32 -top-32 h-[350px] w-[350px] rounded-full bg-[#c09748]/10 blur-[130px] pointer-events-none" />

      <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-12 items-center">
        {/* Texts */}
        <div className="lg:col-span-7">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748] flex items-center gap-1.5">
            <FileText size={13} />
            Technical Resource
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif text-[#17191c] mt-2.5 leading-[1.2]">
            Download The Official 2026 Product & Finish E-Catalogue
          </h2>
          <p className="mt-4 text-[15px] text-[#777b86] leading-relaxed max-w-xl">
            Access our complete technical catalog detailing substrate compatibility matrices, ASTM paint adhesion standards, Dust-Free Clean Environment specifications, and 14 signature finish profiles for OEM and tier-1 product engineers.
          </p>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] text-[#17191c]">
            <div className="flex items-center gap-2">
              <span className="text-[#c09748] font-bold">✓</span> 14 Signature Finish Previews
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#c09748] font-bold">✓</span> Substrate Compatibility Maps
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#c09748] font-bold">✓</span> Cross-Hatch ASTM Test Data
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#c09748] font-bold">✓</span> 4 Production Plant Overviews
            </div>
          </div>
        </div>

        {/* Action Form */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-[20px] border border-[#ececec] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#17191c] mb-4">Request Instant PDF</h3>
          
          {downloaded ? (
            <div className="text-center py-6">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#faf3e0] text-[#8a6521] mb-3 border border-[#f4e5be]">
                <CheckCircle size={22} className="text-[#c09748]" />
              </div>
              <h4 className="text-[15px] font-serif text-[#17191c]">Your Catalogue is Ready!</h4>
              <p className="text-[12px] text-[#777b86] mt-1">PDF download has been triggered in your browser.</p>
              <button 
                onClick={() => setDownloaded(false)}
                className="mt-5 text-[12px] text-[#c09748] hover:underline font-medium cursor-pointer"
              >
                Download again →
              </button>
            </div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleDownload();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#777b86] mb-1">
                  Representative Name
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Mehta"
                  required
                  className="w-full text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#777b86] mb-1">
                  Corporate Email
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rmehta@company.com"
                  required
                  className="w-full text-[13px]"
                />
              </div>

              <button
                type="submit"
                disabled={downloading}
                className="w-full pill-btn-gold !py-3 text-[13px] flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {downloading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent inline-block"></span>
                    <span>Generating Technical PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>Download E-Catalogue (PDF)</span>
                  </>
                )}
              </button>
              
              <p className="text-[11px] text-[#a3a6af] text-center mt-2">
                Confidential B2B documentation. Zero spam guarantee.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
