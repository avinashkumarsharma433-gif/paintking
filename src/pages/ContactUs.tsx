import React, { useState } from 'react';
import { officeAddresses } from '../data';
import { PageBanner } from '../components/PageBanner';
import { Phone, Mail, Send, MapPin, CheckCircle, ShieldAlert } from 'lucide-react';

interface ContactUsProps {
  navigateTo: (page: string) => void;
}

export const ContactUs: React.FC<ContactUsProps> = ({ navigateTo }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('Spray Painting');
  const [message, setMessage] = useState('');
  const [recaptchaChecked, setRecaptchaChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recaptchaChecked) {
      setError('Please click the security verification checkbox first.');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setRecaptchaChecked(false);
    }, 1200);
  };

  return (
    <div className="text-[#17191c] min-h-screen bg-white">
      
      {/* SECTION 1: Page Banner */}
      <PageBanner 
        bgImage="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787132871/paintking/home/hero_slider/spray-painting-on-electrical-switches.webp"
        title="Contact Engineering & Request RFQ" 
        subtitle="Connect with our technical representatives. Request pre-production sample coupons, structural feasibility surveys, or custom tooling proposals."
        breadcrumbs={[{ label: 'Home', pageId: 'home' }, { label: 'Contact Us', active: true }]}
        navigateTo={navigateTo}
      />

      {/* SECTION 2: Form & Fast Contact */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white border border-[#ececec] p-6 sm:p-10 rounded-[24px] shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Fast Turnaround Inquiry</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#17191c] mt-1">Submit Technical Specification</h2>
            <p className="text-[#777b86] text-xs sm:text-sm mt-2">
              Provide substrate geometry and target finish requirements to receive a formal quotation within 24 hours.
            </p>

            {submitted ? (
              <div className="mt-8 text-center p-8 bg-[#fafafb] border border-emerald-200 rounded-[20px]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3 border border-emerald-200">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-lg font-serif text-[#17191c]">Inquiry Received Successfully</h3>
                <p className="text-xs text-[#777b86] mt-2 leading-relaxed max-w-md mx-auto">
                  Thank you for contacting PaintKing. Our chemical and tooling engineers are reviewing your specifications and will respond with technical feedback within 12 working hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-xs text-[#c09748] hover:underline font-semibold cursor-pointer block mx-auto"
                >
                  Send another inquiry →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmission} className="mt-8 space-y-5">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86] mb-2">
                      Full Name *
                    </label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Anand Kumar" 
                      required
                      className="input-editorial w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86] mb-2">
                      Work Email *
                    </label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. akumar@company.com" 
                      required
                      className="input-editorial w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86] mb-2">
                      Phone / WhatsApp *
                    </label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210" 
                      required
                      className="input-editorial w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86] mb-2">
                      Target Division *
                    </label>
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="input-editorial w-full cursor-pointer"
                    >
                      <option value="Spray Painting">Liquid Spray Painting</option>
                      <option value="Hydrographic">Hydrographic 3D Dipping</option>
                      <option value="Digital UV">Direct Flatbed UV Printing</option>
                      <option value="Injection Molding">Plastic Injection Moulding</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86] mb-2">
                    Substrate Details, Estimated Volumes & Coating Requirements
                  </label>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Provide details on base material (e.g. ABS plastic, aluminum, steel?), desired finish texture (Soft Feel, Piano Gloss, Timber Grain?), and monthly production quantities..."
                    className="input-editorial w-full resize-none"
                  ></textarea>
                </div>

                {/* reCAPTCHA Simulation */}
                <div className="p-4 rounded-[16px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      id="recaptcha"
                      type="checkbox" 
                      checked={recaptchaChecked}
                      onChange={(e) => setRecaptchaChecked(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#c09748] cursor-pointer"
                    />
                    <label htmlFor="recaptcha" className="text-xs text-[#777b86] font-medium cursor-pointer select-none">
                      I am not a robot / automated system
                    </label>
                  </div>
                  <div className="text-[9px] text-[#979799] tracking-wider uppercase font-semibold">
                    reCAPTCHA
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-[12px] text-xs text-red-600 flex items-center gap-2">
                    <ShieldAlert size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="pill-btn-filled w-full !py-3.5 text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block"></span>
                      <span>Transmitting Specifications...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Submit Technical RFQ</span>
                    </>
                  )}
                </button>

              </form>
            )}
          </div>

          {/* Right Column: Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Quick Contact Capsule */}
            <div className="p-6 sm:p-7 bg-[#fafafb] border border-[#ececec] rounded-[24px] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Direct Communication</span>
              <h3 className="text-lg font-serif text-[#17191c] mt-1">Executive Contacts</h3>
              
              <div className="mt-5 space-y-3">
                <a href="tel:+919594591313" className="flex items-center gap-3.5 p-3 rounded-[16px] bg-white border border-[#ececec] hover:border-[#c09748]/50 transition-colors">
                  <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-[#faf3e0] text-[#8a6521]">
                    <Phone size={16} className="text-[#c09748]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#979799] uppercase tracking-wider block">Central Hotline</span>
                    <span className="text-sm font-semibold text-[#17191c]">+91 9594591313</span>
                  </div>
                </a>

                <a href="mailto:info@paintking.in" className="flex items-center gap-3.5 p-3 rounded-[16px] bg-white border border-[#ececec] hover:border-[#c09748]/50 transition-colors">
                  <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-[#faf3e0] text-[#8a6521]">
                    <Mail size={16} className="text-[#c09748]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#979799] uppercase tracking-wider block">Technical RFQ Desk</span>
                    <span className="text-sm font-semibold text-[#17191c]">info@paintking.in</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Plant locations list */}
            <div className="p-6 sm:p-7 bg-[#fafafb] border border-[#ececec] rounded-[24px] shadow-xs space-y-4">
              <div className="border-b border-[#ececec] pb-3">
                <h4 className="text-xs font-serif text-[#17191c] uppercase tracking-wider">Manufacturing Unit Addresses</h4>
              </div>
              {officeAddresses.map((o) => (
                <div key={o.name} className="flex gap-3">
                  <MapPin size={15} className="text-[#c09748] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-[#17191c]">{o.name}</span>
                    <p className="text-[11px] text-[#777b86] mt-0.5 leading-relaxed">{o.address}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 3: Plant Locations Map Nodes */}
      <section className="bg-[#fafafb] border-t border-[#ececec] py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Geographic Coordinates</span>
            <h2 className="text-2xl sm:text-4xl font-serif text-[#17191c] mt-1">Operational Map Nodes</h2>
            <p className="mt-2 text-[#777b86] text-xs sm:text-sm max-w-2xl mx-auto">
              Inspect coordinates for our high-capacity Mumbai Head Office facility and Haridwar industrial manufacturing center.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Map 1: Mumbai */}
            <div className="rounded-[24px] overflow-hidden border border-[#ececec] bg-white p-4 flex flex-col justify-between gap-3 h-[360px] shadow-xs">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-semibold text-[#17191c]">Mumbai Unit</span>
                <span className="text-[#777b86] text-xs">(Head Office & R&D Lab)</span>
              </div>
              <div className="relative flex-grow rounded-[16px] overflow-hidden bg-[#fafafb] border border-[#ececec]">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3768.172909403264!2d72.8256194!3d19.2094833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b7194f276637%3A0xe5a36ebd7cbd7cbd!2sCharkop%20Industrial%20Estate%20Kandivali%20West!5e0!3m2!1sen!2sin!4v1714567890123" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="PaintKing Head Office Mumbai map"
                  className="absolute inset-0 h-full w-full"
                ></iframe>
              </div>
            </div>

            {/* Map 2: Haridwar */}
            <div className="rounded-[24px] overflow-hidden border border-[#ececec] bg-white p-4 flex flex-col justify-between gap-3 h-[360px] shadow-xs">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-semibold text-[#17191c]">Haridwar Unit</span>
                <span className="text-[#777b86] text-xs">(Integrated Manufacturing Unit)</span>
              </div>
              <div className="relative flex-grow rounded-[16px] overflow-hidden bg-[#fafafb] border border-[#ececec]">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3458.1235125432!2d78.0123512!3d29.9123512!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390956c35a1236fb%3A0xeabde1234abcd05f!2sIntegrated%20Industrial%20Estate%20SIDCUL%20Haridwar!5e0!3m2!1sen!2sin!4v1714567890124" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="PaintKing Haridwar unit map"
                  className="absolute inset-0 h-full w-full"
                ></iframe>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};
