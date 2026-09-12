import React from 'react';
import { officeAddresses } from '../data';
import { PageBanner } from '../components/PageBanner';
import { DownloadCatalogue } from '../components/DownloadCatalogue';
import { MapPin, Compass, Eye, Linkedin } from 'lucide-react';
import { motion } from 'motion/react';

interface AboutUsProps {
  navigateTo: (page: string) => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({ navigateTo }) => {
  return (
    <div className="text-[#17191c] min-h-screen bg-white">
      
      {/* SECTION 1: Page Banner */}
      <PageBanner 
        bgImage="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787131946/paintking/spray_painting/facility_and_qc/quality-control-spectrophotometer-paintking.webp"
        title="Heritage, Mission & Leadership" 
        subtitle="Discover our 30-year journey as India's premier B2B surface decoration and engineering coating partner."
        breadcrumbs={[{ label: 'Home', pageId: 'home' }, { label: 'About Us', active: true }]}
        navigateTo={navigateTo}
      />

      {/* SECTION 2: Vision & Mission */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748] block">Corporate Charter</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] leading-tight">Our Mission & Principles</h2>
            <div className="h-0.5 w-12 bg-[#c09748] rounded-full" />

            {/* Mission Panel */}
            <div className="p-6 rounded-[24px] bg-[#fafafb] border border-[#ececec] shadow-xs">
              <h3 className="text-xs font-semibold uppercase text-[#8a6521] tracking-wider flex items-center gap-2">
                <Compass size={16} className="text-[#c09748]" />
                Our Mission Statement
              </h3>
              <p className="mt-3 text-[#17191c] text-sm font-serif leading-relaxed italic">
                "To serve as an indispensable high-precision extension of our OEM partners, engineering world-class surface aesthetics with relentless fidelity in quality, pricing, and volume reliability."
              </p>
            </div>

            {/* Vision Panel */}
            <div className="p-6 rounded-[24px] bg-[#fafafb] border border-[#ececec] shadow-xs">
              <h3 className="text-xs font-semibold uppercase text-[#8a6521] tracking-wider flex items-center gap-2">
                <Eye size={16} className="text-[#c09748]" />
                Our Vision Statement
              </h3>
              <p className="mt-3 text-[#17191c] text-sm font-serif leading-relaxed italic">
                "When you grow, we grow. Building India's definitive benchmark in dust-free liquid spray coatings, 3D immersion hydrographics, and industrial direct UV printing."
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigateTo('contact')}
                className="pill-btn-filled text-sm cursor-pointer"
              >
                Connect With Our Engineering Team →
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 overflow-hidden rounded-[24px] border border-[#ececec] h-[320px] sm:h-[450px] shadow-sm bg-[#17191c]"
          >
            <img 
              src="https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&q=80&w=800" 
              alt="Quality surface inspection" 
              className="h-full w-full object-cover filter saturate-110 brightness-95"
            />
          </motion.div>

        </div>
      </section>

      {/* SECTION 2 (Locations): Our Locations */}
      <section className="bg-[#fafafb] border-y border-[#ececec] py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Manufacturing Footprint</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#17191c] mt-2">Strategic Plant Locations</h2>
            <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
            <p className="mt-4 text-[#777b86] text-xs sm:text-sm">
              Strategic production units in Vapi, Mumbai, Haridwar, and Vasai—positioned adjacent to key automotive and electronics industrial corridors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {officeAddresses.map((office) => (
              <div 
                key={office.name} 
                className="group p-6 rounded-[24px] bg-white border border-[#ececec] shadow-xs flex flex-col justify-between hover:border-[#c09748]/50 transition-all duration-300"
              >
                <div>
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#faf3e0] text-[#8a6521] mb-4">
                    <MapPin size={18} className="text-[#c09748]" />
                  </div>
                  <h3 className="text-sm font-serif text-[#17191c]">{office.name}</h3>
                  <p className="text-[#777b86] text-xs leading-relaxed mt-2">
                    {office.address}
                  </p>
                </div>
                
                <div className="border-t border-[#f2f2f3] pt-4 mt-6 text-[10px] font-semibold text-[#8a6521] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active Production Plant
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: Meet Our Founder */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Executive Leadership</span>
          <h2 className="text-3xl font-serif text-[#17191c] sm:text-5xl mt-2">Meet Our Founders</h2>
          <div className="mx-auto mt-4 h-0.5 w-12 rounded-full bg-[#c09748]" />
        </motion.div>

        {/* Dual Founders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Founder 1 */}
          <div className="p-6 sm:p-8 rounded-[24px] border border-[#ececec] bg-white flex flex-col justify-between shadow-xs hover:border-[#c09748]/50 transition-all duration-300">
            <div>
              <div className="relative h-64 overflow-hidden rounded-[16px] bg-[#17191c] mb-6">
                <img 
                  src="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787131763/paintking/about_us/founder_and_team/founder-image.webp" 
                  alt="Founder Kuldeep Singh" 
                  className="h-full w-full object-cover object-top brightness-95"
                />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Founding Director</span>
              <h3 className="text-xl font-serif text-[#17191c] mt-1">Kuldeep Singh</h3>
              <p className="text-[#777b86] text-xs sm:text-sm mt-3 leading-relaxed">
                Under his stewardship, PaintKing expanded from a specialized coating workshop into an ISO-certified multi-plant enterprise. Devoted to technical chemical calibration and plant engineering.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-[#f2f2f3] flex items-center justify-between">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer referrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#17191c] hover:text-[#c09748] transition-colors"
              >
                <Linkedin size={14} className="text-[#c09748]" />
                <span>LinkedIn Profile</span>
              </a>
              <span className="text-[11px] font-medium text-[#979799]">Founder & Director</span>
            </div>
          </div>

          {/* Founder 2 */}
          <div className="p-6 sm:p-8 rounded-[24px] border border-[#ececec] bg-white flex flex-col justify-between shadow-xs hover:border-[#c09748]/50 transition-all duration-300">
            <div>
              <div className="relative h-64 overflow-hidden rounded-[16px] bg-[#17191c] mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400" 
                  alt="Founder Gurprit Singh" 
                  className="h-full w-full object-cover object-top brightness-95"
                />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Director of Operations</span>
              <h3 className="text-xl font-serif text-[#17191c] mt-1">Gurprit Singh</h3>
              <p className="text-[#777b86] text-xs sm:text-sm mt-3 leading-relaxed">
                Directing day-to-day plant operations, supply chain logistics, and Tier-1 OEM integrations. His focus on strict AQL metrics and streamlined production cycles ensures our zero-defect commitments are met.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-[#f2f2f3] flex items-center justify-between">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer referrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#17191c] hover:text-[#c09748] transition-colors"
              >
                <Linkedin size={14} className="text-[#c09748]" />
                <span>LinkedIn Profile</span>
              </a>
              <span className="text-[11px] font-medium text-[#979799]">Co-Director</span>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: Catalogue Brochure */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <DownloadCatalogue />
      </section>

    </div>
  );
};
