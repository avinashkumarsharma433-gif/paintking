import React, { useState } from 'react';
import { jobOpenings } from '../data';
import { PageBanner } from '../components/PageBanner';
import { Briefcase, MapPin, CheckCircle2, ChevronRight, X, Send } from 'lucide-react';

interface CareersProps {
  navigateTo: (page: string) => void;
}

export const Careers: React.FC<CareersProps> = ({ navigateTo }) => {
  const [selectedJob, setSelectedJob] = useState<typeof jobOpenings[0] | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [experienceMonths, setExperienceMonths] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleApply = (job: typeof jobOpenings[0]) => {
    setSelectedJob(job);
    setSubmitted(false);
  };

  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setApplicantName('');
      setApplicantEmail('');
      setExperienceMonths('');
    }, 1200);
  };

  return (
    <div className="text-[#17191c] min-h-screen bg-white">
      
      {/* SECTION 1: Page Banner */}
      <PageBanner 
        bgImage="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132867/paintking/home/hero_slider/paintking-hero-slide-11.webp"
        title="Careers & Engineering Opportunities" 
        subtitle="Join our technical surface engineering team. Build your career within India's premier high-spec industrial finishing facilities."
        breadcrumbs={[{ label: 'Home', pageId: 'home' }, { label: 'Careers', active: true }]}
        navigateTo={navigateTo}
      />

      {/* SECTION 2: Join Our Team */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748] block">Talent & Culture</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] leading-tight">Engineering Growth & Culture</h2>
            <div className="h-0.5 w-12 bg-[#c09748] rounded-full" />

            <p className="text-[#777b86] text-[15px] leading-relaxed">
              At PaintKing, our primary competitive advantage resides in our skilled cleanroom operators, color laboratory chemists, CNC tooling engineers, and production supervisors. We maintain a high-technology workplace combining Dust-Free paint cabins with digital spectrophotometer systems.
            </p>
            <p className="text-[#777b86] text-[15px] leading-relaxed">
              We cultivate individuals committed to craftsmanship and operational rigor. If you hold experience in electrostatic liquid spray, 3D immersion dipping, flatbed UV printing, or plastic injection tooling, explore our open positions below.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-[#17191c]">
              <div className="flex items-center gap-2">
                <span className="text-[#c09748]">✓</span> Dust-Free Dust-Free Facilities
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#c09748]">✓</span> Comprehensive Medical Benefits
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#c09748]">✓</span> Technical Training & Leadership Path
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 overflow-hidden rounded-[24px] border border-[#ececec] h-[320px] sm:h-[450px] shadow-sm bg-[#17191c]">
            <img 
              src="https://images.unsplash.com/photo-1541829011-8319f36f1242?auto=format&fit=crop&q=80&w=800" 
              alt="Industrial team at work" 
              className="h-full w-full object-cover filter saturate-110 brightness-95"
            />
          </div>

        </div>
      </section>

      {/* SECTION 3: Open Vacancies (Listing) */}
      <section className="bg-[#fafafb] border-t border-[#ececec] py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Current Openings</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">Open Positions</h2>
            <div className="mx-auto mt-4 h-0.5 w-12 bg-[#c09748] rounded-full" />
          </div>

          {/* Job opening cards list */}
          <div className="space-y-4 max-w-3xl mx-auto">
            {jobOpenings.map((job) => (
              <div 
                key={job.id} 
                className="p-6 rounded-[24px] border border-[#ececec] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-[#c09748]/50 shadow-xs hover:shadow-md transition-all duration-300"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[10px] font-medium text-[#17191c] bg-[#f2f2f3] px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <Briefcase size={12} className="text-[#c09748]" />
                      {job.department}
                    </span>
                    <span className="text-[10px] font-semibold text-[#8a6521] bg-[#faf3e0] px-2.5 py-1 rounded-full border border-[#f4e5be] flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#c09748]" />
                      {job.location}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-serif text-[#17191c] mt-2">
                    {job.title}
                  </h3>
                  <p className="text-[#777b86] text-xs sm:text-sm mt-1 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleApply(job)}
                    className="pill-btn-filled text-xs !py-2.5 !px-5 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Apply Now</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOBS DETAILS APPLICATION DIALOG */}
      {selectedJob && (
        <div 
          onClick={() => setSelectedJob(null)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full rounded-[24px] overflow-hidden bg-white border border-[#ececec] shadow-2xl p-6 sm:p-8 flex flex-col gap-5 my-8"
          >
            <div className="flex items-start justify-between border-b border-[#ececec] pb-4">
              <div>
                <span className="text-[10px] font-semibold text-[#8a6521] bg-[#faf3e0] px-2.5 py-1 rounded-full border border-[#f4e5be] uppercase tracking-wider inline-block">
                  {selectedJob.department} • {selectedJob.location}
                </span>
                <h3 className="text-xl font-serif text-[#17191c] mt-2">{selectedJob.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f2f3] text-[#17191c] hover:bg-[#c09748] hover:text-white cursor-pointer transition-colors"
                aria-label="Close form"
              >
                <X size={15} />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-8 bg-[#fafafb] rounded-[16px] border border-emerald-200 p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3 border border-emerald-200">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="text-base font-serif text-[#17191c]">Application Submitted Successfully</h4>
                <p className="text-xs text-[#777b86] mt-2 leading-relaxed">
                  Thank you, {applicantName}. Our operations team will review your qualifications and contact you within 2-3 business days.
                </p>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="mt-5 pill-btn-filled text-xs !py-2.5 !px-5 cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 bg-[#fafafb] rounded-[16px] border border-[#ececec]">
                  <h4 className="text-xs font-semibold text-[#17191c] uppercase tracking-wider mb-2">
                    Key Requirements:
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedJob.requirements.map((req, idx) => (
                      <li key={idx} className="text-xs text-[#777b86] flex items-start gap-2">
                        <span className="text-[#c09748] font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <form onSubmit={handleFormSubmission} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86] mb-1.5">
                      Full Name *
                    </label>
                    <input 
                      type="text" 
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. Gurpreet Singh" 
                      required
                      className="input-editorial w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86] mb-1.5">
                        Email Address *
                      </label>
                      <input 
                        type="email" 
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        placeholder="e.g. gsingh@gmail.com" 
                        required
                        className="input-editorial w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86] mb-1.5">
                        Experience (Months) *
                      </label>
                      <input 
                        type="number" 
                        value={experienceMonths}
                        onChange={(e) => setExperienceMonths(e.target.value)}
                        placeholder="e.g. 36" 
                        required
                        className="input-editorial w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86] mb-1.5">
                      Brief Experience Summary
                    </label>
                    <textarea 
                      rows={3}
                      placeholder="Outline your background with spray guns, water dipping, UV flatbeds, or injection tooling..."
                      required
                      className="input-editorial w-full resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="pill-btn-filled w-full !py-3.5 text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block"></span>
                        <span>Registering Application...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Submit Job Application</span>
                      </>
                    )}
                  </button>

                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
